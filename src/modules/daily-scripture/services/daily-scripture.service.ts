import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { DailyScriptureDocument } from '../schemas/daily-scripture.schema';
import { DailyScriptureRepository } from '../repositories/daily-scripture.repository';

@Injectable()
export class DailyScriptureService extends BaseService<DailyScriptureDocument> {
  constructor(private dailyScriptureRepository: DailyScriptureRepository) {
    super(dailyScriptureRepository);
  }

  async findByUser(userId: string) {
    return this.dailyScriptureRepository.findByUser(userId);
  }

  async findByUserAndDate(userId: string, date: Date) {
    return this.dailyScriptureRepository.findByUserAndDate(userId, date);
  }
}
