import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { DailyScriptureDocument } from '../schemas/daily-scripture.schema';
import { DailyScriptureRepository } from '../repositories/daily-scripture.repository';
import { DailyScriptureSchedulerService } from './daily-scripture-scheduler.service';

@Injectable()
export class DailyScriptureService extends BaseService<DailyScriptureDocument> {
  constructor(
    private dailyScriptureRepository: DailyScriptureRepository,
    private scheduler: DailyScriptureSchedulerService,
  ) {
    super(dailyScriptureRepository);
  }

  findByUser(userId: string) {
    return this.dailyScriptureRepository.findByUser(userId);
  }

  async findByUserAndDate(userId: string, date: Date) {
    return this.dailyScriptureRepository.findByUserAndDate(userId, date);
  }

  /**
   * Returns today's verse for the user.
   * 1. Fetches today's global verse from the Bible API (auto-caches).
   * 2. Finds or auto-creates a per-user DailyScripture record from it.
   * 3. Returns the record so the user can track isCompleted.
   */
  async getTodayForUser(
    userId: string,
  ): Promise<DailyScriptureDocument | null> {
    const globalVerse = await this.scheduler.fetchTodayOrTrigger();
    if (!globalVerse) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.dailyScriptureRepository.findByUserAndDate(
      userId,
      today,
    );
    if (existing) return existing;

    return this.dailyScriptureRepository.create({
      userId,
      title: (globalVerse as any).reference,
      scriptureReference: (globalVerse as any).reference,
      content: (globalVerse as any).text,
      date: today,
      isCompleted: false,
    });
  }

  async markCompleted(id: string): Promise<DailyScriptureDocument | null> {
    return this.dailyScriptureRepository.update(id, { isCompleted: true });
  }
}
