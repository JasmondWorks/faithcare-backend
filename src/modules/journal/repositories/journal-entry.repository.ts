import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  JournalEntry,
  JournalEntryDocument,
} from '../schemas/journal-entry.schema';

@Injectable()
export class JournalEntryRepository extends BaseRepository<JournalEntryDocument> {
  constructor(
    @InjectModel(JournalEntry.name)
    journalEntryModel: Model<JournalEntryDocument>,
  ) {
    super(journalEntryModel);
  }

  async findByUser(userId: string) {
    return this.model
      .find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }
}
