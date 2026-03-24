import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  PrimePrayerRequest,
  PrimePrayerRequestDocument,
} from '../schemas/prime-prayer-request.schema';

@Injectable()
export class PrimePrayerRequestRepository extends BaseRepository<PrimePrayerRequestDocument> {
  constructor(
    @InjectModel(PrimePrayerRequest.name)
    model: Model<PrimePrayerRequestDocument>,
  ) {
    super(model);
  }
}
