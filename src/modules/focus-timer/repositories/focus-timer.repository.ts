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

  async findByUser(userId: string) {
    return this.model
      .find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActiveByUser(userId: string) {
    return this.model
      .findOne({
        userId,
        status: FocusTimerStatus.IN_PROGRESS,
        isDeleted: false,
      })
      .exec();
  }
}
