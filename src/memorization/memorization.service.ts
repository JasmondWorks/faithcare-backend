import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  UserVerseMemory,
  UserVerseMemoryDocument,
  MemoryStatus,
} from './schemas/user-verse-memory.schema';
import { Verse, VerseDocument } from './schemas/verse.schema';
import {
  VerseCollection,
  VerseCollectionDocument,
} from './schemas/verse-collection.schema';
import {
  MemorizationGroup,
  MemorizationGroupDocument,
} from './schemas/memorization-group.schema';
import {
  DailyMemorizationLog,
  DailyMemorizationLogDocument,
} from './schemas/daily-memorization-log.schema';
import { SrsService } from './srs/srs.service';
import { PracticeService } from './practice/practice.service';
import { BibleApiService } from './bible/bible-api.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { AddVerseDto } from './dto/add-verse.dto';
import { SearchVerseDto } from './dto/search-verse.dto';

export interface VerseMasteredEvent {
  userId: string;
  verseId: string;
  reference: string;
  organizationId: string;
}

@Injectable()
export class MemorizationService {
  constructor(
    @InjectModel(UserVerseMemory.name)
    private readonly memoryModel: Model<UserVerseMemoryDocument>,
    @InjectModel(Verse.name)
    private readonly verseModel: Model<VerseDocument>,
    @InjectModel(VerseCollection.name)
    private readonly collectionModel: Model<VerseCollectionDocument>,
    @InjectModel(MemorizationGroup.name)
    private readonly groupModel: Model<MemorizationGroupDocument>,
    @InjectModel(DailyMemorizationLog.name)
    private readonly logModel: Model<DailyMemorizationLogDocument>,
    private readonly srsService: SrsService,
    private readonly practiceService: PracticeService,
    private readonly bibleApiService: BibleApiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Queue ──────────────────────────────────────────────────────────────────

  async getDueQueue(userId: string, organizationId: string, limit = 10) {
    const safeLimit = Math.min(limit, 20);

    const memories = await this.memoryModel
      .find({
        userId,
        organizationId,
        nextReviewAt: { $lte: new Date() },
        status: { $in: [MemoryStatus.LEARNING, MemoryStatus.REVIEWING] },
        isDeleted: { $ne: true },
      })
      .limit(safeLimit)
      .populate('verseId')
      .exec();

    const verses = memories.map((m) => {
      const verse = m.verseId as unknown as Verse;
      const challenge = this.practiceService.buildChallenge(
        verse.text,
        verse.reference,
        m.totalReps + 1,
        userId,
        String(m.verseId),
      );
      return {
        verseId: String(m.verseId),
        reference: verse.reference,
        text: verse.text,
        interval: m.interval,
        lastGrade: m.lastGrade,
        challenge,
      };
    });

    return { dueCount: verses.length, verses };
  }

  // ── Review ────────────────────────────────────────────────────────────────

  async submitReview(
    userId: string,
    organizationId: string,
    dto: SubmitReviewDto,
  ) {
    const memory = await this.memoryModel
      .findOne({ userId, verseId: dto.verseId, isDeleted: { $ne: true } })
      .populate('verseId')
      .exec();

    if (!memory) throw new NotFoundException('Verse not found in your learning queue');
    if (memory.organizationId !== organizationId) throw new ForbiddenException();

    // Validate offline reviewedAt — must be within last 7 days
    if (dto.reviewedAt) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (dto.reviewedAt < sevenDaysAgo) {
        throw new BadRequestException('reviewedAt must be within the last 7 days');
      }
    }

    const prevStatus = memory.status;
    const result = this.srsService.calculateNextReview(memory, dto.grade);

    const historyEntry = {
      reviewedAt: dto.reviewedAt ?? new Date(),
      grade: dto.grade,
      intervalBefore: memory.interval,
      intervalAfter: result.interval,
    };

    const updatedHistory = [...memory.reviewHistory, historyEntry].slice(-20);

    const newStreak =
      dto.grade === 'perfect'
        ? memory.streak + 1
        : dto.grade === 'hesitant'
          ? memory.streak
          : 0;

    const nowMastered =
      prevStatus !== MemoryStatus.MASTERED &&
      result.status === MemoryStatus.MASTERED;

    await this.memoryModel
      .findByIdAndUpdate(memory._id, {
        interval: result.interval,
        easeFactor: result.easeFactor,
        nextReviewAt: result.nextReviewAt,
        status: result.status,
        totalReps: memory.totalReps + 1,
        streak: newStreak,
        lastGrade: dto.grade,
        reviewHistory: updatedHistory,
        ...(nowMastered && { masteredAt: new Date() }),
      })
      .exec();

    await this.upsertDailyLog(userId, organizationId, dto.grade, dto.timeSpentSeconds, false);

    if (nowMastered) {
      const verse = memory.verseId as unknown as Verse;
      this.eventEmitter.emit('verse.mastered', {
        userId,
        verseId: String(memory.verseId),
        reference: verse.reference,
        organizationId,
      } satisfies VerseMasteredEvent);
    }

    return {
      nextReviewAt: result.nextReviewAt,
      interval: result.interval,
      status: result.status,
      streakCount: newStreak,
    };
  }

  // ── Add / Remove ──────────────────────────────────────────────────────────

  async addVerse(userId: string, organizationId: string, dto: AddVerseDto) {
    let verse: VerseDocument;

    if (dto.verseId) {
      const found = await this.verseModel.findById(dto.verseId).exec();
      if (!found) throw new NotFoundException('Verse not found');
      verse = found;
    } else {
      if (!dto.reference) {
        throw new BadRequestException('Either verseId or reference is required');
      }
      verse = await this.bibleApiService.findOrCreateVerse(
        dto.reference,
        dto.translation ?? 'KJV',
        organizationId,
      );
    }

    const existing = await this.memoryModel
      .findOne({ userId, verseId: verse._id, isDeleted: { $ne: true } })
      .exec();

    if (existing) {
      if (existing.status === MemoryStatus.ARCHIVED) {
        await this.memoryModel
          .findByIdAndUpdate(existing._id, {
            status: MemoryStatus.LEARNING,
            nextReviewAt: new Date(),
          })
          .exec();
      }
      return { memory: existing };
    }

    const memory = await this.memoryModel.create({
      userId,
      verseId: verse._id,
      organizationId,
      status: MemoryStatus.LEARNING,
      interval: 1,
      easeFactor: 2.5,
      nextReviewAt: new Date(),
      totalReps: 0,
      streak: 0,
      lastGrade: null,
      reviewHistory: [],
    });

    await this.upsertDailyLog(userId, organizationId, null, 0, true);

    return { memory };
  }

  async removeVerse(userId: string, verseId: string) {
    const memory = await this.memoryModel
      .findOne({ userId, verseId, isDeleted: { $ne: true } })
      .exec();
    if (!memory) throw new NotFoundException('Verse not found in your queue');

    await this.memoryModel
      .findByIdAndUpdate(memory._id, { status: MemoryStatus.ARCHIVED })
      .exec();

    return { success: true };
  }

  // ── Progress ──────────────────────────────────────────────────────────────

  async getProgress(userId: string, organizationId: string) {
    const [counts, streak, heatmap, masteredDocs] = await Promise.all([
      this.memoryModel
        .aggregate([
          {
            $match: {
              userId,
              organizationId,
              status: { $ne: MemoryStatus.ARCHIVED },
              isDeleted: { $ne: true },
            },
          },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
      this.getCurrentStreak(userId),
      this.getHeatmapData(userId),
      this.memoryModel
        .find({
          userId,
          organizationId,
          status: MemoryStatus.MASTERED,
          isDeleted: { $ne: true },
        })
        .populate('verseId')
        .sort({ masteredAt: -1 })
        .limit(10)
        .exec(),
    ]);

    const statusCounts: Record<string, number> = {
      [MemoryStatus.MASTERED]: 0,
      [MemoryStatus.REVIEWING]: 0,
      [MemoryStatus.LEARNING]: 0,
    };
    let totalVerses = 0;
    for (const c of counts) {
      statusCounts[c._id as string] = c.count as number;
      totalVerses += c.count as number;
    }

    const topVerses = masteredDocs.map((m) => {
      const v = m.verseId as unknown as Verse;
      return {
        verseId: String(m.verseId),
        reference: v.reference,
        translation: v.translation,
        masteredAt: m.masteredAt,
      };
    });

    return {
      totalVerses,
      mastered: statusCounts[MemoryStatus.MASTERED],
      reviewing: statusCounts[MemoryStatus.REVIEWING],
      learning: statusCounts[MemoryStatus.LEARNING],
      currentStreak: streak,
      heatmapData: heatmap,
      topVerses,
    };
  }

  // ── Collections ───────────────────────────────────────────────────────────

  async getCollections(organizationId: string, theme?: string) {
    const filter: Record<string, any> = {
      $or: [{ isGlobal: true }, { organizationId }],
      isDeleted: { $ne: true },
    };
    if (theme) filter.theme = new RegExp(theme, 'i');
    return this.collectionModel.find(filter).populate('verseIds').exec();
  }

  async enqueueCollection(
    userId: string,
    organizationId: string,
    collectionId: string,
  ) {
    const collection = await this.collectionModel
      .findOne({ _id: collectionId, isDeleted: { $ne: true } })
      .exec();
    if (!collection) throw new NotFoundException('Collection not found');

    const results = await Promise.allSettled(
      collection.verseIds.map((vid) =>
        this.addVerse(userId, organizationId, { verseId: String(vid) }),
      ),
    );

    const added = results.filter((r) => r.status === 'fulfilled').length;
    return { added, total: collection.verseIds.length };
  }

  // ── Verse search ──────────────────────────────────────────────────────────

  async searchVerse(organizationId: string, dto: SearchVerseDto) {
    return this.bibleApiService.fetchVerse(
      dto.reference,
      dto.translation ?? 'KJV',
      organizationId,
    );
  }

  // ── Group stats ───────────────────────────────────────────────────────────

  async getGroupStats(groupId: string, organizationId: string) {
    const group = await this.groupModel
      .findOne({ _id: groupId, organizationId, isDeleted: { $ne: true } })
      .exec();
    if (!group) throw new NotFoundException('Group not found');

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString().slice(0, 10);

    const [masteredCount, weeklyLogs] = await Promise.all([
      this.memoryModel.countDocuments({
        userId: { $in: group.memberIds },
        status: MemoryStatus.MASTERED,
        isDeleted: { $ne: true },
      }),
      this.logModel
        .find({ userId: { $in: group.memberIds }, date: { $gte: weekStart } })
        .exec(),
    ]);

    const weeklyReviews = weeklyLogs.reduce((sum, l) => sum + l.versesReviewed, 0);

    const reviewedDates = new Set(weeklyLogs.map((l) => l.date));
    let collectiveStreak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (reviewedDates.has(d.toISOString().slice(0, 10))) {
        collectiveStreak++;
      } else {
        break;
      }
    }

    const activeMembers = new Set(
      weeklyLogs.filter((l) => l.versesReviewed > 0).map((l) => l.userId),
    ).size;

    return {
      groupName: group.name,
      totalVersesMemorized: masteredCount,
      activeMembers,
      collectiveStreak,
      weeklyReviews,
    };
  }

  // ── Streak & heatmap ──────────────────────────────────────────────────────

  async getCurrentStreak(userId: string): Promise<number> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLog = await this.logModel.findOne({ userId, date: todayStr }).exec();

    // Forgiveness: if no review today yet, check from yesterday
    const cursor = new Date();
    if (!todayLog || todayLog.versesReviewed === 0) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const log = await this.logModel.findOne({ userId, date: dateStr }).exec();
      if (log && log.versesReviewed > 0) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  async getHeatmapData(
    userId: string,
    days = 365,
  ): Promise<Array<{ date: string; count: number }>> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const logs = await this.logModel
      .find({ userId, date: { $gte: startStr, $lte: endStr } })
      .exec();

    const map = new Map(logs.map((l) => [l.date, l.versesReviewed]));

    const result: Array<{ date: string; count: number }> = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const d = cursor.toISOString().slice(0, 10);
      result.push({ date: d, count: map.get(d) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  async upsertDailyLog(
    userId: string,
    organizationId: string,
    grade: 'perfect' | 'hesitant' | 'failed' | null,
    timeSpentSeconds: number,
    isNew: boolean,
  ): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    const inc: Record<string, number> = { totalTimeSeconds: timeSpentSeconds };

    if (isNew) {
      inc.versesLearned = 1;
    } else {
      inc.versesReviewed = 1;
      if (grade === 'perfect') inc.perfectCount = 1;
      else if (grade === 'hesitant') inc.hesitantCount = 1;
      else if (grade === 'failed') inc.failedCount = 1;
    }

    await this.logModel
      .findOneAndUpdate(
        { userId, date },
        { $inc: inc, $setOnInsert: { organizationId } },
        { upsert: true, new: true },
      )
      .exec();
  }

  async getDueCountsPerUser(): Promise<Array<{ userId: string; organizationId: string; count: number }>> {
    return this.memoryModel
      .aggregate([
        {
          $match: {
            nextReviewAt: { $lte: new Date() },
            status: { $in: [MemoryStatus.LEARNING, MemoryStatus.REVIEWING] },
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: { userId: '$userId', organizationId: '$organizationId' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id.userId',
            organizationId: '$_id.organizationId',
            count: 1,
          },
        },
      ])
      .exec();
  }
}
