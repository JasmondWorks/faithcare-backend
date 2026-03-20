import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { SecondTimerDocument } from '../schemas/second-timer.schema';
import { SecondTimerRepository } from '../repositories/second-timer.repository';

@Injectable()
export class SecondTimerService extends BaseService<SecondTimerDocument> {
  constructor(private secondTimerRepository: SecondTimerRepository) {
    super(secondTimerRepository);
  }

  async findByOrganization(organizationId: string) {
    return this.secondTimerRepository.findByOrganization(organizationId);
  }

  async findByFirstTimer(firstTimerId: string) {
    return this.secondTimerRepository.findByFirstTimer(firstTimerId);
  }
}
