import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { FeedbackDocument } from '../schemas/feedback.schema';
import { FeedbackRepository } from '../repositories/feedback.repository';

@Injectable()
export class FeedbackService extends BaseService<FeedbackDocument> {
  constructor(private readonly feedbackRepository: FeedbackRepository) {
    super(feedbackRepository);
  }

  findByOrganization(organizationId: string) {
    return this.feedbackRepository.findByOrganization(organizationId);
  }

  findByFirstTimer(firstTimerId: string) {
    return this.feedbackRepository.findByFirstTimer(firstTimerId);
  }
}
