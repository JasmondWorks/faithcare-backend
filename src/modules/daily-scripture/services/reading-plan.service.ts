import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ReadingPlanRepository } from '../repositories/reading-plan.repository';
import { UserReadingPlanRepository } from '../repositories/user-reading-plan.repository';
import { ReadingPlanType } from '../schemas/reading-plan.schema';
import {
  NT_CHAPTERS,
  PSALM_CHAPTERS,
  PROVERBS_CHAPTERS,
  GOSPEL_CHAPTERS,
  FULL_BIBLE_CHAPTERS,
} from '../constants/bible-plan-sequences';

export interface TodaysReading {
  dayNumber: number;
  totalDays: number;
  planName: string;
  chapterIds: string[];
  bibleId: string;
  userPlanId: string;
}

const SYSTEM_PLANS = [
  {
    type: ReadingPlanType.NT_90,
    name: 'New Testament in 90 Days',
    description:
      'Read the entire New Testament in 90 days — roughly 3 chapters per day. ' +
      'A focused journey through the life of Jesus and the birth of the Church.',
    chapters: NT_CHAPTERS,
    chaptersPerDay: 3,
    totalDays: 90,
  },
  {
    type: ReadingPlanType.PSALMS_30,
    name: 'Psalms in 30 Days',
    description:
      'Journey through all 150 Psalms in a month — 5 chapters per day. ' +
      "Israel's ancient songbook covering praise, lament, and trust.",
    chapters: PSALM_CHAPTERS,
    chaptersPerDay: 5,
    totalDays: 30,
  },
  {
    type: ReadingPlanType.PROVERBS_31,
    name: 'Proverbs in 31 Days',
    description:
      'One chapter of Proverbs each day for a month. ' +
      'Practical wisdom for everyday life, relationships, and integrity.',
    chapters: PROVERBS_CHAPTERS,
    chaptersPerDay: 1,
    totalDays: 31,
  },
  {
    type: ReadingPlanType.GOSPELS_30,
    name: 'The Gospels in 30 Days',
    description:
      'Read through Matthew, Mark, Luke, and John in 30 days. ' +
      'The life, ministry, death, and resurrection of Jesus from four perspectives.',
    chapters: GOSPEL_CHAPTERS,
    chaptersPerDay: 3,
    totalDays: 30,
  },
  {
    type: ReadingPlanType.BIBLE_365,
    name: 'Bible in a Year',
    description:
      'Read the entire Bible in one year — approximately 3-4 chapters daily. ' +
      'From Genesis to Revelation, the complete story of God and humanity.',
    chapters: FULL_BIBLE_CHAPTERS,
    chaptersPerDay: Math.ceil(FULL_BIBLE_CHAPTERS.length / 365),
    totalDays: 365,
  },
];

@Injectable()
export class ReadingPlanService implements OnModuleInit {
  constructor(
    private readonly planRepo: ReadingPlanRepository,
    private readonly userPlanRepo: UserReadingPlanRepository,
  ) { }

  async onModuleInit() {
    for (const plan of SYSTEM_PLANS) {
      const existing = await this.planRepo.findByType(plan.type);
      if (!existing) {
        await this.planRepo.create({ ...plan, isSystem: true });
        console.log(`Seeded reading plan: ${plan.name}`);
      }
    }
  }

  getAvailablePlans() {
    return this.planRepo.findSystemPlans();
  }

  async subscribeToplan(
    userId: string,
    planId: string,
    translationId: string,
  ) {
    const plan = await this.planRepo.findById(planId);
    if (!plan) throw new NotFoundException('Reading plan not found');

    // Pause all other active plans, then upsert this one.
    // Upsert prevents duplicate rows when the user re-subscribes to the same plan.
    await this.userPlanRepo.pauseAllActive(userId);
    return this.userPlanRepo.upsertForPlan(userId, planId, translationId);
  }

  async getAllNonCompletedPlans(userId: string, pagination: { page: number; limit: number } = { page: 1, limit: 20 }) {
    const { data: rawPlans, meta } = await this.userPlanRepo.findAllNonCompletedByUser(userId, pagination);

    // Guard against legacy duplicate rows: keep only the most recent record per planId.
    const seen = new Set<string>();
    const userPlans = rawPlans.filter((up) => {
      const pid = String((up as any).planId);
      if (seen.has(pid)) return false;
      seen.add(pid);
      return true;
    });

    const data = (await Promise.all(
      userPlans.map(async (userPlan) => {
        const plan = await this.planRepo.findById(String((userPlan as any).planId));
        if (!plan) return null;

        const status = (userPlan as any).status as string;
        const dayNumber =
          status === 'paused' && (userPlan as any).pausedOnDay != null
            ? (userPlan as any).pausedOnDay
            : this.computeDay(userPlan as any);

        const totalDays = (plan as any).totalDays as number;
        const progress = Math.round((dayNumber / totalDays) * 100);

        return {
          id: String((userPlan as any)._id),
          planId: String((userPlan as any).planId),
          planName: (plan as any).name,
          planDescription: (plan as any).description,
          totalDays,
          currentDay: dayNumber,
          progressPercent: Math.min(progress, 100),
          status,
          translationId: (userPlan as any).translationId,
          startDate: (userPlan as any).startDate,
        };
      }),
    )).filter(Boolean);

    return { data, meta };
  }

  async getActivePlan(userId: string) {
    const userPlan = await this.userPlanRepo.findActiveByUser(userId);
    if (!userPlan) return null;

    const plan = await this.planRepo.findById(
      String((userPlan as any).planId),
    );
    if (!plan) return null;

    const dayNumber = this.computeDay(userPlan as any);
    const progress = Math.round((dayNumber / (plan as any).totalDays) * 100);

    return {
      id: String((userPlan as any)._id),
      planId: String((userPlan as any).planId),
      planName: (plan as any).name,
      planDescription: (plan as any).description,
      totalDays: (plan as any).totalDays,
      currentDay: dayNumber,
      progressPercent: Math.min(progress, 100),
      status: (userPlan as any).status,
      translationId: (userPlan as any).translationId,
      startDate: (userPlan as any).startDate,
    };
  }

  async getTodaysReading(userId: string): Promise<TodaysReading | null> {
    const userPlan = await this.userPlanRepo.findActiveByUser(userId);
    if (!userPlan) return null;

    const plan = await this.planRepo.findById(
      String((userPlan as any).planId),
    );
    if (!plan) return null;

    const dayNumber = this.computeDay(userPlan as any);
    const chapters = (plan as any).chapters as string[];
    const cpd = (plan as any).chaptersPerDay as number;
    const totalDays = (plan as any).totalDays as number;

    if (dayNumber > totalDays) {
      await this.userPlanRepo.update(String((userPlan as any)._id), {
        status: 'completed',
      });
      return null;
    }

    const start = (dayNumber - 1) * cpd;
    const chapterIds = chapters.slice(start, start + cpd);

    return {
      dayNumber,
      totalDays,
      planName: (plan as any).name,
      chapterIds,
      bibleId: (userPlan as any).translationId,
      userPlanId: String((userPlan as any)._id),
    };
  }

  async pausePlan(userId: string) {
    const userPlan = await this.userPlanRepo.findActiveByUser(userId);
    if (!userPlan) throw new NotFoundException('No active reading plan');
    const day = this.computeDay(userPlan as any);
    return this.userPlanRepo.update(String((userPlan as any)._id), {
      status: 'paused',
      pausedOnDay: day,
    });
  }

  async resumePlan(userId: string, userPlanId: string) {
    const userPlan = await this.userPlanRepo.findById(userPlanId);
    if (!userPlan || String((userPlan as any).userId) !== userId) {
      throw new NotFoundException('Reading plan not found');
    }
    if ((userPlan as any).status !== 'paused') {
      throw new NotFoundException('No paused reading plan');
    }

    // Pause whatever is currently active before resuming the chosen plan
    await this.userPlanRepo.pauseAllActive(userId);

    const pausedDay = (userPlan as any).pausedOnDay ?? 1;
    const newStart = new Date();
    newStart.setDate(newStart.getDate() - (pausedDay - 1));
    newStart.setHours(0, 0, 0, 0);

    return this.userPlanRepo.update(userPlanId, {
      status: 'active',
      startDate: newStart,
      pausedOnDay: null,
    });
  }

  private computeDay(userPlan: any): number {
    const start = new Date(userPlan.startDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1
    );
  }
}
