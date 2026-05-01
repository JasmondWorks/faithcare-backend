import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BibleApiService } from './bible-api.service';
import {
  GlobalDailyVerse,
  GlobalDailyVerseDocument,
} from '../schemas/global-daily-verse.schema';

@Injectable()
export class DailyScriptureSchedulerService {
  private readonly logger = new Logger(DailyScriptureSchedulerService.name);

  constructor(
    @InjectModel(GlobalDailyVerse.name)
    private readonly verseModel: Model<GlobalDailyVerseDocument>,
    private readonly bibleApi: BibleApiService,
  ) {}

  @Cron('0 6 * * *')
  async fetchAndStoreDailyVerse(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.verseModel.findOne({ date: today }).exec();
    if (existing) return;

    const verse = await this.bibleApi.fetchVerseOfTheDay();
    if (!verse) {
      this.logger.warn(`No verse fetched for ${today}`);
      return;
    }

    await this.verseModel.create({ date: today, ...verse });
    this.logger.log(`Daily verse stored for ${today}: ${verse.reference}`);
  }

  async fetchForDate(
    dateStr: string,
  ): Promise<GlobalDailyVerseDocument | null> {
    return this.verseModel.findOne({ date: dateStr }).exec();
  }

  async fetchTodayOrTrigger(): Promise<GlobalDailyVerseDocument | null> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.verseModel.findOne({ date: today }).exec();
    if (existing) return existing;

    await this.fetchAndStoreDailyVerse();
    return this.verseModel.findOne({ date: today }).exec();
  }
}
