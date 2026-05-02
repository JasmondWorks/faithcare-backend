import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { FirstTimer, FirstTimerDocument } from '../schemas/first-timer.schema';

@Injectable()
export class FirstTimerRepository extends BaseRepository<FirstTimerDocument> {
  constructor(
    @InjectModel(FirstTimer.name)
    firstTimerModel: Model<FirstTimerDocument>,
  ) {
    super(firstTimerModel);
  }

  async findByOrganization(
    organizationId: string,
    filters?: { status?: string; visitType?: string },
  ) {
    const query: Record<string, any> = {
      organizationId,
      isDeleted: { $ne: true },
    };
    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters?.visitType) {
      query.visitType = filters.visitType;
    }
    return this.model.find(query).sort({ createdAt: -1 }).exec();
  }

  async findDueFollowUps() {
    return this.model
      .find({
        status: 'PENDING',
        followUpScheduledAt: { $lte: new Date() },
        isDeleted: { $ne: true },
      })
      .exec();
  }
}
