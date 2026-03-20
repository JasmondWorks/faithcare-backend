import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { SalvationRecordDocument } from '../schemas/salvation-record.schema';
import { SalvationRecordRepository } from '../repositories/salvation-record.repository';

@Injectable()
export class SalvationRecordService extends BaseService<SalvationRecordDocument> {
  constructor(private salvationRecordRepository: SalvationRecordRepository) {
    super(salvationRecordRepository);
  }

  async findByOrganization(organizationId: string) {
    return this.salvationRecordRepository.findByOrganization(organizationId);
  }
}
