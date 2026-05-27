import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  PrayerRequest,
  PrayerRequestDocument,
} from '../schemas/prayer-request.schema';

@Injectable()
export class PrayerRequestRepository extends BaseRepository<PrayerRequestDocument> {
  constructor(
    @InjectModel(PrayerRequest.name)
    prayerRequestModel: Model<PrayerRequestDocument>,
  ) {
    super(prayerRequestModel);
  }

  async findByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.paginate({ organizationId }, { ...pagination, sort: { createdAt: -1 } });
  }
}
