import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { PrayerRequestDocument } from '../schemas/prayer-request.schema';
import { PrayerRequestRepository } from '../repositories/prayer-request.repository';

@Injectable()
export class PrayerRequestService extends BaseService<PrayerRequestDocument> {
  constructor(private prayerRequestRepository: PrayerRequestRepository) {
    super(prayerRequestRepository);
  }

  async findByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.prayerRequestRepository.findByOrganization(organizationId, pagination);
  }
}
