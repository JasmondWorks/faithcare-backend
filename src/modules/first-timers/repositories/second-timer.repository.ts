import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  SecondTimer,
  SecondTimerDocument,
} from '../schemas/second-timer.schema';

@Injectable()
export class SecondTimerRepository extends BaseRepository<SecondTimerDocument> {
  constructor(
    @InjectModel(SecondTimer.name)
    secondTimerModel: Model<SecondTimerDocument>,
  ) {
    super(secondTimerModel);
  }

  async findByOrganization(organizationId: string) {
    return this.model.find({ organizationId, isDeleted: false }).exec();
  }

  async findByFirstTimer(firstTimerId: string) {
    return this.model.find({ firstTimerId, isDeleted: false }).exec();
  }
}
