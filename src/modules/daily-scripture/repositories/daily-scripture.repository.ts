import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  DailyScripture,
  DailyScriptureDocument,
} from '../schemas/daily-scripture.schema';

@Injectable()
export class DailyScriptureRepository extends BaseRepository<DailyScriptureDocument> {
  constructor(
    @InjectModel(DailyScripture.name)
    dailyScriptureModel: Model<DailyScriptureDocument>,
  ) {
    super(dailyScriptureModel);
  }

  async findByUser(userId: string, pagination: { page: number; limit: number } = { page: 1, limit: 20 }) {
    return this.paginate({ userId, isDeleted: { $ne: true } }, { ...pagination, sort: { date: -1 } });
  }

  async findByUserAndDate(userId: string, date: Date, userReadingPlanId?: string | null) {
    const query: any = { userId, date, isDeleted: { $ne: true } };
    if (userReadingPlanId !== undefined) {
      query.userReadingPlanId = userReadingPlanId;
    }
    return this.model.findOne(query).exec();
  }

  /** Returns the most recent completed entry strictly before `beforeDate`. */
  async findLastCompletedBefore(userId: string, beforeDate: Date) {
    return this.model
      .findOne({
        userId,
        isCompleted: true,
        date: { $lt: beforeDate },
        isDeleted: { $ne: true },
      })
      .sort({ date: -1 })
      .exec();
  }
}
