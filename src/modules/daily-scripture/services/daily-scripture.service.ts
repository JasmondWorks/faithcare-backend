import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from 'src/core/services/base.service';
import {
  UserMetaData,
  UserMetaDataDocument,
} from 'src/modules/users/schemas/user-metadata.schema';
import { DailyScriptureDocument } from '../schemas/daily-scripture.schema';
import { DailyScriptureRepository } from '../repositories/daily-scripture.repository';
import { DailyScriptureSchedulerService } from './daily-scripture-scheduler.service';
import { BibleContentService } from './bible-content.service';
import { ScriptureReflectionService } from './scripture-reflection.service';
import { ReadingPlanService } from './reading-plan.service';

@Injectable()
export class DailyScriptureService extends BaseService<DailyScriptureDocument> {
  constructor(
    private dailyScriptureRepository: DailyScriptureRepository,
    private scheduler: DailyScriptureSchedulerService,
    private bibleContent: BibleContentService,
    private reflections: ScriptureReflectionService,
    private readingPlans: ReadingPlanService,
    @InjectModel(UserMetaData.name)
    private userMetadataModel: Model<UserMetaDataDocument>,
  ) {
    super(dailyScriptureRepository);
  }

  findByUser(userId: string, pagination: { page: number; limit: number } = { page: 1, limit: 20 }) {
    return this.dailyScriptureRepository.findByUser(userId, pagination);
  }

  findByUserAndDate(userId: string, date: Date, userReadingPlanId?: string | null) {
    return this.dailyScriptureRepository.findByUserAndDate(userId, date, userReadingPlanId);
  }

  /**
   * Returns today's reading for the user.
   *
   * Priority:
   * 1. If the user has an active reading plan → fetch today's plan chapters from
   *    api.bible + generate/retrieve AI reflections for each chapter.
   * 2. Fallback → the global verse of the day (ourmanna.com / cached).
   *
   * In both cases, finds or creates a DailyScripture record so isCompleted
   * and personalNotes are persisted.
   */
  async getTodayForUser(userId: string, translationId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── Reading plan path ───────────────────────────────────────────────
    const todaysReading = await this.readingPlans.getTodaysReading(userId);
    if (todaysReading) {
      try {
        const existing = await this.dailyScriptureRepository.findByUserAndDate(
          userId,
          today,
          todaysReading.userPlanId,
        );

        const activeBibleId = translationId || todaysReading.bibleId;

        // Fetch all chapters for today's reading in parallel
        const chapters = await Promise.all(
          todaysReading.chapterIds.map((cid) =>
            this.bibleContent.getChapter(activeBibleId, cid),
          ),
        );

        // Generate/retrieve reflections for the first chapter
        const primaryChapter = chapters[0];
        const reflection = primaryChapter
          ? await this.reflections.getOrGenerate(
            (primaryChapter as any).chapterId,
            (primaryChapter as any).reference,
            (primaryChapter as any).verses,
          )
          : null;

        if (!existing) {
          const firstRef = (primaryChapter as any)?.reference ?? 'Today\'s Reading';
          await this.dailyScriptureRepository.create({
            userId,
            title: todaysReading.planName,
            scriptureReference: firstRef,
            content: (primaryChapter as any)?.rawHtml ?? '',
            date: today,
            isCompleted: false,
            completedAt: null,
            personalNotes: null,
            chapterId: (primaryChapter as any)?.chapterId ?? null,
            bibleId: activeBibleId,
            userReadingPlanId: todaysReading.userPlanId,
            planDay: todaysReading.dayNumber,
          });
        }

        const record = existing ??
          (await this.dailyScriptureRepository.findByUserAndDate(userId, today, todaysReading.userPlanId));

        return {
          type: 'plan' as const,
          dayNumber: todaysReading.dayNumber,
          totalDays: todaysReading.totalDays,
          planName: todaysReading.planName,
          bibleId: activeBibleId,
          chapters: chapters.map((c: any) => ({
            id: c.chapterId,
            reference: c.reference,
            verses: c.verses,
            nextChapterId: c.nextChapterId,
            prevChapterId: c.prevChapterId,
          })),
          reflection,
          record,
        };
      } catch (error: any) {
        Logger.error(
          `Failed to fetch reading plan, falling back to global verse. Error: ${error.message}`,
          'DailyScriptureService',
        );
      }
    }

    // ── Global verse fallback ────────────────────────────────────────────
    const globalVerse = await this.scheduler.fetchTodayOrTrigger();
    if (!globalVerse) return null;

    let fallbackText = (globalVerse as any).text;
    let fallbackVersion = (globalVerse as any).version;
    let fallbackChapterId = null;

    if (translationId) {
      const translated = await this.bibleContent.getTranslatedGlobalVerse(translationId, (globalVerse as any).reference);
      if (translated && translated.text) {
        fallbackText = translated.text;
        fallbackChapterId = translated.chapterId;
        const bibles = await this.bibleContent.getAvailableBibles();
        const target = bibles.find(b => b.id === translationId);
        if (target) fallbackVersion = target.abbreviation;
      }
    } else {
      const bibles = await this.bibleContent.getAvailableBibles();
      const defaultBible = bibles.find(b => b.abbreviation === fallbackVersion) || bibles[0];
      if (defaultBible) {
        const translated = await this.bibleContent.getTranslatedGlobalVerse(defaultBible.id, (globalVerse as any).reference);
        if (translated) {
           fallbackChapterId = translated.chapterId;
        }
      }
    }

    const existing = await this.dailyScriptureRepository.findByUserAndDate(
      userId,
      today,
      null,
    );
    if (!existing) {
      await this.dailyScriptureRepository.create({
        userId,
        title: (globalVerse as any).reference,
        scriptureReference: (globalVerse as any).reference,
        content: (globalVerse as any).text, // Original text in DB
        date: today,
        isCompleted: false,
        completedAt: null,
        personalNotes: null,
        chapterId: null,
        bibleId: null,
        userReadingPlanId: null,
        planDay: null,
      });
    }

    const record =
      existing ??
      (await this.dailyScriptureRepository.findByUserAndDate(userId, today, null));

    return {
      type: 'global_verse' as const,
      reference: (globalVerse as any).reference,
      chapterId: fallbackChapterId,
      text: fallbackText,
      version: fallbackVersion,
      record,
    };
  }

  /** Fetch a specific chapter with its cached reflection (for browsing). */
  async getChapterWithReflection(bibleId: string, chapterId: string) {
    const chapter = await this.bibleContent.getChapter(bibleId, chapterId);
    const reflection = await this.reflections.getOrGenerate(
      (chapter as any).chapterId,
      (chapter as any).reference,
      (chapter as any).verses,
    );
    return { chapter, reflection };
  }

  /** Update personal notes on a scripture entry. */
  async updateNotes(
    id: string,
    userId: string,
    notes: string,
  ): Promise<DailyScriptureDocument | null> {
    const record = await this.dailyScriptureRepository.findById(id);
    if (!record) throw new NotFoundException('Scripture entry not found');
    if (String((record as any).userId) !== userId) {
      throw new ForbiddenException('You can only edit your own scripture notes');
    }
    return this.dailyScriptureRepository.update(id, { personalNotes: notes });
  }

  /**
   * Marks a scripture entry as read.
   * - Verifies the entry belongs to the authenticated user.
   * - Idempotent: calling it a second time returns the record unchanged.
   * - Records `completedAt` timestamp.
   * - Updates the user's `dailyBibleReadingStreakCount` in their metadata:
   *     - Completed yesterday → streak + 1
   *     - Gap of more than 1 day → streak resets to 1
   */
  async markCompleted(
    id: string,
    userId: string,
  ): Promise<DailyScriptureDocument | null> {
    const record = await this.dailyScriptureRepository.findById(id);
    if (!record) throw new NotFoundException('Scripture entry not found');

    if (String((record as any).userId) !== userId) {
      throw new ForbiddenException(
        'You can only mark your own scripture as complete',
      );
    }

    // Idempotent — already marked, return as-is
    if ((record as any).isCompleted) return record;

    const completedAt = new Date();
    const updated = await this.dailyScriptureRepository.update(id, {
      isCompleted: true,
      completedAt,
    });

    await this.recalculateStreak(userId, (record as any).date as Date);

    return updated;
  }

  private async recalculateStreak(
    userId: string,
    scriptureDate: Date,
  ): Promise<void> {
    // Normalise to midnight so comparisons are day-level only
    const today = new Date(scriptureDate);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastCompleted =
      await this.dailyScriptureRepository.findLastCompletedBefore(
        userId,
        today,
      );

    let newStreak = 1; // default: first entry or gap in chain
    if (lastCompleted) {
      const lastDate = new Date((lastCompleted as any).date);
      lastDate.setHours(0, 0, 0, 0);

      if (lastDate.getTime() === yesterday.getTime()) {
        // Consecutive day — extend the streak
        const metadata = await this.userMetadataModel
          .findOne({ userId })
          .exec();
        const current = (metadata as any)?.dailyBibleReadingStreakCount ?? 0;
        newStreak = current + 1;
      }
      // Otherwise the chain is broken — newStreak stays 1
    }

    await this.userMetadataModel
      .findOneAndUpdate({ userId }, { dailyBibleReadingStreakCount: newStreak })
      .exec();
  }
}
