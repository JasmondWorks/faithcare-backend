import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from 'src/core/services/base.service';
import { UserMetaDataDocument } from '../schemas/user-metadata.schema';
import { UserMetaDataRepository } from '../repositories/user-metadata.repository';
import { User, UserDocument } from '../schemas/user.schema';
import {
  DailyScripture,
  DailyScriptureDocument,
} from '../../daily-scripture/schemas/daily-scripture.schema';
import {
  FocusTimer,
  FocusTimerDocument,
} from '../../focus-timer/schemas/focus-timer.schema';
import { FocusTimerStatus } from 'src/core/enums/focus-timer-status.enum';
import {
  UserVerseMemory,
  UserVerseMemoryDocument,
} from '../../../memorization/schemas/user-verse-memory.schema';
import {
  JournalEntry,
  JournalEntryDocument,
} from '../../journal/schemas/journal-entry.schema';

@Injectable()
export class UserMetaDataService extends BaseService<UserMetaDataDocument> {
  constructor(
    private userMetaDataRepository: UserMetaDataRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(DailyScripture.name)
    private dailyScriptureModel: Model<DailyScriptureDocument>,
    @InjectModel(FocusTimer.name)
    private focusTimerModel: Model<FocusTimerDocument>,
    @InjectModel(UserVerseMemory.name)
    private verseMemoryModel: Model<UserVerseMemoryDocument>,
    @InjectModel(JournalEntry.name)
    private journalEntryModel: Model<JournalEntryDocument>,
  ) {
    super(userMetaDataRepository);
  }

  /** Creates metadata and marks the user as onboarded. */
  async create(data: any): Promise<UserMetaDataDocument> {
    const record = await super.create(data);
    if (data.userId) {
      await this.userModel.findByIdAndUpdate(data.userId, {
        isOnboarded: true,
      });
    }
    return record;
  }

  async findByUserId(userId: string) {
    return this.userMetaDataRepository.findByUserId(userId);
  }

  async connectToChurch(
    userId: string,
    dto: { organization?: string | null; churchName?: string | null },
  ) {
    if (!dto.organization && !dto.churchName) {
      throw new BadRequestException(
        'Provide either organization or churchName',
      );
    }
    if (dto.organization && dto.churchName) {
      throw new BadRequestException(
        'Provide only one of organization or churchName, not both',
      );
    }

    const metadata = await this.userMetaDataRepository.findByUserId(userId);
    if (!metadata) throw new NotFoundException('User metadata not found');

    const update = dto.organization
      ? { organization: dto.organization, churchName: null }
      : { organization: null, churchName: dto.churchName };

    await this.userMetaDataRepository.update(String(metadata._id), update);
    return this.userMetaDataRepository.findByUserId(userId);
  }
  async deleteMetadata(id: string): Promise<boolean> {
    const metadata = await this.userMetaDataRepository.findById(id);
    if (metadata && metadata.userId) {
      await this.userModel.findByIdAndUpdate(metadata.userId, {
        isOnboarded: false,
      });
    }
    return super.delete(id) as any;
<<<<<<< HEAD
  }

  async getDashboard(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      metadata,
      scripturesTotalRead,
      focusSessionsTotal,
      recentFocusSessions,
      latestMeditations,
      recentJournalDocs,
      recentScriptureDocs,
      recentFocusDocs,
    ] = await Promise.all([
      this.userMetaDataRepository.findByUserId(userId),
      this.dailyScriptureModel.countDocuments({
        userId,
        isCompleted: true,
        isDeleted: { $ne: true },
      }),
      this.focusTimerModel.countDocuments({
        userId,
        status: FocusTimerStatus.COMPLETED,
        isDeleted: { $ne: true },
      }),
      this.focusTimerModel
        .find({ userId, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .exec(),
      this.verseMemoryModel
        .find({ userId, isDeleted: { $ne: true } })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('verseId')
        .exec(),
      this.journalEntryModel
        .find({
          userId,
          createdAt: { $gte: thirtyDaysAgo },
          isDeleted: { $ne: true },
        })
        .select('createdAt')
        .exec(),
      this.dailyScriptureModel
        .find({
          userId,
          isCompleted: true,
          completedAt: { $gte: thirtyDaysAgo },
          isDeleted: { $ne: true },
        })
        .select('completedAt')
        .exec(),
      this.focusTimerModel
        .find({
          userId,
          status: FocusTimerStatus.COMPLETED,
          createdAt: { $gte: thirtyDaysAgo },
          isDeleted: { $ne: true },
        })
        .select('createdAt')
        .exec(),
    ]);

    const toDateSet = (docs: any[], field: string): string[] => [
      ...new Set<string>(
        docs.map((d) => new Date(d[field]).toISOString().split('T')[0]),
      ),
    ];

    return {
      success: true,
      data: {
        streaks: {
          loginStreak: (metadata as any)?.loginStreakCount ?? 0,
          journalStreak: (metadata as any)?.journalStreakCount ?? 0,
          scriptureStreak: (metadata as any)?.dailyBibleReadingStreakCount ?? 0,
        },
        totals: {
          scriptures: scripturesTotalRead,
          focusSessions: focusSessionsTotal,
        },
        recentFocusSessions,
        latestMeditations,
        consistency: {
          journalDates: toDateSet(recentJournalDocs, 'createdAt'),
          scriptureDates: toDateSet(recentScriptureDocs, 'completedAt'),
          focusDates: toDateSet(recentFocusDocs, 'createdAt'),
        },
      },
    };
=======
>>>>>>> 8d281b409a65de5464e3071ff22536d17257c91f
  }
}
