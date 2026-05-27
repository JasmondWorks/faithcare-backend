import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Verse, VerseSchema } from './schemas/verse.schema';
import {
  VerseCollection,
  VerseCollectionSchema,
} from './schemas/verse-collection.schema';
import {
  UserVerseMemory,
  UserVerseMemorySchema,
} from './schemas/user-verse-memory.schema';
import {
  MemorizationGroup,
  MemorizationGroupSchema,
} from './schemas/memorization-group.schema';
import {
  DailyMemorizationLog,
  DailyMemorizationLogSchema,
} from './schemas/daily-memorization-log.schema';
import { SrsService } from './srs/srs.service';
import { PracticeService } from './practice/practice.service';
import { BibleApiService } from './bible/bible-api.service';
import { MemorizationService } from './memorization.service';
import { MemorizationController } from './memorization.controller';
import { MemorizationScheduler } from './scheduler/memorization.scheduler';
import { MemorizationEventsListener } from './events/memorization-events.listener';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Verse.name, schema: VerseSchema },
      { name: VerseCollection.name, schema: VerseCollectionSchema },
      { name: UserVerseMemory.name, schema: UserVerseMemorySchema },
      { name: MemorizationGroup.name, schema: MemorizationGroupSchema },
      { name: DailyMemorizationLog.name, schema: DailyMemorizationLogSchema },
    ]),
  ],
  controllers: [MemorizationController],
  providers: [
    SrsService,
    PracticeService,
    BibleApiService,
    MemorizationService,
    MemorizationScheduler,
    MemorizationEventsListener,
  ],
  exports: [MemorizationService],
})
export class MemorizationModule {}
