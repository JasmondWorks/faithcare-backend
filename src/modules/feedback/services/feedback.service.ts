import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FeedbackDocument } from '../schemas/feedback.schema';
import { FeedbackRepository } from '../repositories/feedback.repository';

@Injectable()
export class FeedbackService extends BaseService<FeedbackDocument> {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly notifications: NotificationsService,
  ) {
    super(feedbackRepository);
  }

  async create(data: any): Promise<FeedbackDocument> {
    const record = await super.create(data);
    const orgId = String((record as any).organizationId ?? '');
    if (orgId) {
      this.notifications.notifyFeedbackReceived(orgId, {
        id: String((record as any)._id),
        visitorName: (record as any).visitorName,
        channel: (record as any).channel,
        organizationId: orgId,
      });
    }
    return record;
  }

  findByOrganization(organizationId: string) {
    return this.feedbackRepository.findByOrganization(organizationId);
  }

  findByFirstTimer(firstTimerId: string) {
    return this.feedbackRepository.findByFirstTimer(firstTimerId);
  }
}
