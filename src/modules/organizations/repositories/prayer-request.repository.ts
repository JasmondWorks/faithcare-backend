import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { PrayerRequest, PrayerRequestDocument } from '../schemas/prayer-request.schema';

@Injectable()
export class PrayerRequestRepository extends BaseRepository<PrayerRequestDocument> {
  constructor(
    @InjectModel(PrayerRequest.name)
    prayerRequestModel: Model<PrayerRequestDocument>,
  ) {
    super(prayerRequestModel);
  }

  async findByOrganization(organizationId: string) {
    return this.model.find({ organizationId, isDeleted: false }).exec();
  }
}
