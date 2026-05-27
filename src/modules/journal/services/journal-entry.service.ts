import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from 'src/core/services/base.service';
import { JournalEntryDocument } from '../schemas/journal-entry.schema';
import { JournalEntryRepository } from '../repositories/journal-entry.repository';
import {
  UserMetaData,
  UserMetaDataDocument,
} from 'src/modules/users/schemas/user-metadata.schema';

@Injectable()
export class JournalEntryService extends BaseService<JournalEntryDocument> {
  constructor(
    private journalEntryRepository: JournalEntryRepository,
    @InjectModel(UserMetaData.name)
    private userMetadataModel: Model<UserMetaDataDocument>,
  ) {
    super(journalEntryRepository);
  }

  async create(data: any): Promise<JournalEntryDocument> {
    const entry = await super.create(data);
    if (data.userId) {
      this.updateJournalStreak(String(data.userId)).catch(() => {});
    }
    return entry;
  }

  async findByUser(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.journalEntryRepository.findByUser(userId, pagination);
  }

  private async updateJournalStreak(userId: string): Promise<void> {
    const metadata = await this.userMetadataModel.findOne({ userId }).exec();
    if (!metadata) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastJournal = metadata.lastJournalDate ? new Date(metadata.lastJournalDate) : null;
    if (lastJournal) {
      lastJournal.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - lastJournal.getTime()) / 86400000);
      if (daysDiff === 0) return;
      const newStreak = daysDiff === 1 ? metadata.journalStreakCount + 1 : 1;
      await this.userMetadataModel.findByIdAndUpdate(metadata._id, {
        journalStreakCount: newStreak,
        lastJournalDate: today,
      }).exec();
    } else {
      await this.userMetadataModel.findByIdAndUpdate(metadata._id, {
        journalStreakCount: 1,
        lastJournalDate: today,
      }).exec();
    }
  }
}
