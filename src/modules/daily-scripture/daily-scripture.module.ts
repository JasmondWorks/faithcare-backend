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
import { DailyScriptureRepository } from './repositories/daily-scripture.repository';
import { DailyScriptureService } from './services/daily-scripture.service';
import { BibleApiService } from './services/bible-api.service';
import { DailyScriptureSchedulerService } from './services/daily-scripture-scheduler.service';
import { DailyScriptureController } from './controllers/daily-scripture.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyScripture.name, schema: DailyScriptureSchema },
      { name: GlobalDailyVerse.name, schema: GlobalDailyVerseSchema },
    ]),
  ],
  controllers: [DailyScriptureController],
  providers: [
    DailyScriptureRepository,
    DailyScriptureService,
    BibleApiService,
    DailyScriptureSchedulerService,
  ],
  exports: [DailyScriptureService],
})
export class DailyScriptureModule {}
