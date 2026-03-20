import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { DailyScripture, DailyScriptureDocument } from '../schemas/daily-scripture.schema';

@Injectable()
export class DailyScriptureRepository extends BaseRepository<DailyScriptureDocument> {
  constructor(
    @InjectModel(DailyScripture.name)
    dailyScriptureModel: Model<DailyScriptureDocument>,
  ) {
    super(dailyScriptureModel);
  }

  async findByUser(userId: string) {
    return this.model.find({ userId, isDeleted: false }).sort({ date: -1 }).exec();
  }

  async findByUserAndDate(userId: string, date: Date) {
    return this.model.findOne({ userId, date, isDeleted: false }).exec();
  }
}
