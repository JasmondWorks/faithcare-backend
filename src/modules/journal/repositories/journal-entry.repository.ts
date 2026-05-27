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

  async findByUser(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.paginate({ userId }, { ...pagination, sort: { createdAt: -1 } });
  }
}
