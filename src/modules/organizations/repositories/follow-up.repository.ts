import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { FollowUp, FollowUpDocument } from '../schemas/follow-up.schema';

@Injectable()
export class FollowUpRepository extends BaseRepository<FollowUpDocument> {
  constructor(
    @InjectModel(FollowUp.name)
    followUpModel: Model<FollowUpDocument>,
  ) {
    super(followUpModel);
  }

  async findByOrganization(organizationId: string) {
    return this.model.find({ organizationId, isDeleted: { $ne: true } }).exec();
  }

  async findByMember(newMemberId: string) {
    return this.model.find({ newMemberId, isDeleted: { $ne: true } }).exec();
  }
}
