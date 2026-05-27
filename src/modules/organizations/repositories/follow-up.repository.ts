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

  async findByOrganization(
    organizationId: string,
    filters?: { status?: string; type?: string },
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    const query: Record<string, any> = { organizationId };
    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;
    return this.paginate(query, { ...pagination, sort: { createdAt: -1 } });
  }

  async findByMember(targetId: string) {
    return this.model
      .find({ targetId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByContactPhone(phone: string) {
    // Match on the last 10 digits to handle +country-code variations
    const digits = phone.replace(/\D/g, '').slice(-10);
    return this.model
      .find({
        contactPhone: { $regex: new RegExp(`${digits}$`) },
        isDeleted: { $ne: true },
      })
      .sort({ updatedAt: -1 })
      .limit(1)
      .exec();
  }
}
