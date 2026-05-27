import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  JournalEntry,
  JournalEntrySchema,
} from './schemas/journal-entry.schema';
import {
  UserMetaData,
  UserMetaDataSchema,
} from '../users/schemas/user-metadata.schema';
import { JournalEntryRepository } from './repositories/journal-entry.repository';
import { JournalEntryService } from './services/journal-entry.service';
import { JournalEntryController } from './controllers/journal-entry.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JournalEntry.name, schema: JournalEntrySchema },
      { name: UserMetaData.name, schema: UserMetaDataSchema },
    ]),
  ],
  controllers: [JournalEntryController],
  providers: [JournalEntryRepository, JournalEntryService],
  exports: [JournalEntryService],
})
export class JournalModule {}
