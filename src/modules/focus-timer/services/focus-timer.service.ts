import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { FocusTimerDocument } from '../schemas/focus-timer.schema';
import { FocusTimerRepository } from '../repositories/focus-timer.repository';

@Injectable()
export class FocusTimerService extends BaseService<FocusTimerDocument> {
  constructor(private focusTimerRepository: FocusTimerRepository) {
    super(focusTimerRepository);
  }

  async findByUser(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.focusTimerRepository.findByUser(userId, pagination);
  }

  async findActiveByUser(userId: string) {
    return this.focusTimerRepository.findActiveByUser(userId);
  }
}
