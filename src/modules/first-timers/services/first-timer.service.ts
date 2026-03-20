import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { FirstTimerDocument } from '../schemas/first-timer.schema';
import { FirstTimerRepository } from '../repositories/first-timer.repository';

@Injectable()
export class FirstTimerService extends BaseService<FirstTimerDocument> {
  constructor(private firstTimerRepository: FirstTimerRepository) {
    super(firstTimerRepository);
  }

  async findByOrganization(organizationId: string) {
    return this.firstTimerRepository.findByOrganization(organizationId);
  }
}
