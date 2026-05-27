import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  AdminApplication,
  AdminApplicationDocument,
} from '../schemas/admin-application.schema';

@Injectable()
export class AdminApplicationRepository extends BaseRepository<AdminApplicationDocument> {
  constructor(
    @InjectModel(AdminApplication.name) model: Model<AdminApplicationDocument>,
  ) {
    super(model);
  }

  findByApplicant(applicantId: string) {
    return this.model
      .findOne({ applicantId, isDeleted: { $ne: true } })
      .populate('organizationId')
      .exec();
  }

  async findByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    const page = Math.max(1, pagination.page);
    const limit = Math.min(100, Math.max(1, pagination.limit));
    const skip = (page - 1) * limit;
    const filter = { organizationId, status: 'PENDING', isDeleted: { $ne: true } };

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('applicantId', 'name email createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  findExpiredPending() {
    return this.model
      .find({
        status: 'PENDING',
        expiresAt: { $lte: new Date() },
        isDeleted: { $ne: true },
      })
      .exec();
  }
}
