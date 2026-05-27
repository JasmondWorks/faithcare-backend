import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  SalvationRecord,
  SalvationRecordDocument,
} from '../schemas/salvation-record.schema';

@Injectable()
export class SalvationRecordRepository extends BaseRepository<SalvationRecordDocument> {
  constructor(
    @InjectModel(SalvationRecord.name)
    salvationRecordModel: Model<SalvationRecordDocument>,
  ) {
    super(salvationRecordModel);
  }

  async findByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.paginate({ organizationId }, { ...pagination, sort: { createdAt: -1 } });
  }
}
