import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  UserReadingPlan,
  UserReadingPlanDocument,
} from '../schemas/user-reading-plan.schema';

@Injectable()
export class UserReadingPlanRepository extends BaseRepository<UserReadingPlanDocument> {
  constructor(
    @InjectModel(UserReadingPlan.name) model: Model<UserReadingPlanDocument>,
  ) {
    super(model);
  }

  findActiveByUser(userId: string) {
    return this.model.findOne({ userId, status: 'active' }).exec();
  }

  findAllNonCompletedByUser(userId: string, pagination: { page: number; limit: number } = { page: 1, limit: 20 }) {
    return this.paginate(
      { userId, status: { $in: ['active', 'paused'] } },
      { ...pagination, sort: { createdAt: -1 } },
    );
  }

  upsertForPlan(userId: string, planId: string, translationId: string) {
    return this.model
      .findOneAndUpdate(
        { userId, planId },
        { translationId, startDate: new Date(), status: 'active', pausedOnDay: null },
        { new: true, upsert: true },
      )
      .exec();
  }

  pauseAllActive(userId: string) {
    return this.model
      .updateMany({ userId, status: 'active' }, { status: 'paused' })
      .exec();
  }
}
