import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { MessageLog, MessageLogDocument } from '../schemas/message-log.schema';

@Injectable()
export class MessageLogRepository extends BaseRepository<MessageLogDocument> {
  constructor(
    @InjectModel(MessageLog.name)
    model: Model<MessageLogDocument>,
  ) {
    super(model);
  }

  async findByOrganization(organizationId: string) {
    return this.model
      .find({ organizationId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByFirstTimer(firstTimerId: string) {
    return this.model
      .find({ firstTimerId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }
}
