import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { ReadingPlan, ReadingPlanDocument } from '../schemas/reading-plan.schema';

@Injectable()
export class ReadingPlanRepository extends BaseRepository<ReadingPlanDocument> {
  constructor(
    @InjectModel(ReadingPlan.name) model: Model<ReadingPlanDocument>,
  ) {
    super(model);
  }

  findSystemPlans() {
    return this.model.find({ isSystem: true }, { chapters: 0 }).exec();
  }

  findByType(type: string) {
    return this.model.findOne({ type }).exec();
  }
}
