import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { FirstTimer, FirstTimerDocument } from '../schemas/first-timer.schema';

@Injectable()
export class FirstTimerRepository extends BaseRepository<FirstTimerDocument> {
  constructor(
    @InjectModel(FirstTimer.name)
    firstTimerModel: Model<FirstTimerDocument>,
  ) {
    super(firstTimerModel);
  }

  async findByOrganization(organizationId: string) {
    return this.model.find({ organizationId, isDeleted: false }).exec();
  }
}
