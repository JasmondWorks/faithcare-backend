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

  async findByOrganization(organizationId: string) {
    return this.model.find({ organizationId, isDeleted: false }).exec();
  }
}
