import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { FocusTimer, FocusTimerDocument } from '../schemas/focus-timer.schema';
import { FocusTimerStatus } from 'src/core/enums/focus-timer-status.enum';

@Injectable()
export class FocusTimerRepository extends BaseRepository<FocusTimerDocument> {
  constructor(
    @InjectModel(FocusTimer.name)
    focusTimerModel: Model<FocusTimerDocument>,
  ) {
    super(focusTimerModel);
  }

  async findByUser(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.paginate({ userId }, { ...pagination, sort: { createdAt: -1 } });
  }

  async findActiveByUser(userId: string) {
    return this.model
      .findOne({
        userId,
        status: FocusTimerStatus.IN_PROGRESS,
        isDeleted: { $ne: true },
      })
      .exec();
  }
}
