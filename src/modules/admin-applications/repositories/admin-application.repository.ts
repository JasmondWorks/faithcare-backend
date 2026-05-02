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

  findByOrganization(organizationId: string) {
    return this.model
      .find({ organizationId, status: 'PENDING', isDeleted: { $ne: true } })
      .populate('applicantId', 'name email createdAt')
      .sort({ createdAt: -1 })
      .exec();
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
