import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyScripture,
  DailyScriptureSchema,
} from './schemas/daily-scripture.schema';
import {
  GlobalDailyVerse,
  GlobalDailyVerseSchema,
} from './schemas/global-daily-verse.schema';
import {
  BibleChapterCache,
  BibleChapterCacheSchema,
} from './schemas/bible-chapter-cache.schema';
import {
  PassageReflection,
  PassageReflectionSchema,
} from './schemas/passage-reflection.schema';
import {
  ReadingPlan,
  ReadingPlanSchema,
} from './schemas/reading-plan.schema';
import {
  UserReadingPlan,
  UserReadingPlanSchema,
} from './schemas/user-reading-plan.schema';
import {
  BookmarkedVerse,
  BookmarkedVerseSchema,
} from './schemas/bookmarked-verse.schema';
import {
  UserMetaData,
  UserMetaDataSchema,
} from '../users/schemas/user-metadata.schema';

import { DailyScriptureRepository } from './repositories/daily-scripture.repository';
import { ReadingPlanRepository } from './repositories/reading-plan.repository';
import { UserReadingPlanRepository } from './repositories/user-reading-plan.repository';
import { BookmarkedVerseRepository } from './repositories/bookmarked-verse.repository';

import { DailyScriptureService } from './services/daily-scripture.service';
import { BibleApiService } from './services/bible-api.service';
import { BibleContentService } from './services/bible-content.service';
import { ScriptureReflectionService } from './services/scripture-reflection.service';
import { DailyScriptureSchedulerService } from './services/daily-scripture-scheduler.service';
import { ReadingPlanService } from './services/reading-plan.service';

import { DailyScriptureController } from './controllers/daily-scripture.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyScripture.name,      schema: DailyScriptureSchema },
      { name: GlobalDailyVerse.name,    schema: GlobalDailyVerseSchema },
      { name: BibleChapterCache.name,   schema: BibleChapterCacheSchema },
      { name: PassageReflection.name,   schema: PassageReflectionSchema },
      { name: ReadingPlan.name,         schema: ReadingPlanSchema },
      { name: UserReadingPlan.name,     schema: UserReadingPlanSchema },
      { name: BookmarkedVerse.name,     schema: BookmarkedVerseSchema },
      { name: UserMetaData.name,        schema: UserMetaDataSchema },
    ]),
  ],
  controllers: [DailyScriptureController],
  providers: [
    DailyScriptureRepository,
    ReadingPlanRepository,
    UserReadingPlanRepository,
    BookmarkedVerseRepository,
    DailyScriptureService,
    BibleApiService,
    BibleContentService,
    ScriptureReflectionService,
    DailyScriptureSchedulerService,
    ReadingPlanService,
  ],
  exports: [DailyScriptureService],
})
export class DailyScriptureModule {}
