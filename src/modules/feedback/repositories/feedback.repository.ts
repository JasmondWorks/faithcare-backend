import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { Feedback, FeedbackDocument } from '../schemas/feedback.schema';

@Injectable()
export class FeedbackRepository extends BaseRepository<FeedbackDocument> {
  constructor(@InjectModel(Feedback.name) model: Model<FeedbackDocument>) {
    super(model);
  }

  findByOrganization(organizationId: string) {
    return this.model
      .find({ organizationId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  findByFirstTimer(firstTimerId: string) {
    return this.model
      .find({ firstTimerId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }
}
