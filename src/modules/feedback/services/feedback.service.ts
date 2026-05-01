import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { MessagingService } from 'src/core/services/messaging.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FeedbackDocument } from '../schemas/feedback.schema';
import { FeedbackRepository } from '../repositories/feedback.repository';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class FeedbackService extends BaseService<FeedbackDocument> {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly messaging: MessagingService,
    private readonly notifications: NotificationsService,
  ) {
    super(feedbackRepository);
  }

  async create(data: any): Promise<FeedbackDocument> {
    const record = await super.create(data);
    this.emitFeedbackEvent(record);
    return record;
  }

  /** Send a WhatsApp or SMS message to a visitor, then log it as a feedback record. */
  async sendMessage(
    dto: SendMessageDto,
  ): Promise<FeedbackDocument & { delivered: boolean }> {
    const delivered = await this.messaging.sendToVisitor({
      channel: dto.channel,
      to: dto.phoneNumber,
      template: dto.message,
      vars: {},
      organizationId: dto.organizationId,
      recipientName: dto.visitorName,
    });

    const record = await this.feedbackRepository.create({
      organizationId: dto.organizationId,
      firstTimerId: dto.firstTimerId ?? null,
      visitorName: dto.visitorName,
      phoneNumber: dto.phoneNumber,
      channel: dto.channel,
      sentMessage: dto.message,
      receivedMessage: null,
      deliveryStatus: delivered ? 'sent' : 'failed',
    });

    this.emitFeedbackEvent(record);
    return Object.assign(record, { delivered });
  }

  /** Log the visitor's inbound reply on an existing feedback thread. */
  async logReply(
    id: string,
    receivedMessage: string,
  ): Promise<FeedbackDocument | null> {
    const record = await this.feedbackRepository.findById(id);
    if (!record) throw new NotFoundException('Feedback record not found');
    return this.feedbackRepository.update(id, { receivedMessage });
  }

  findByOrganization(organizationId: string) {
    return this.feedbackRepository.findByOrganization(organizationId);
  }

  findByFirstTimer(firstTimerId: string) {
    return this.feedbackRepository.findByFirstTimer(firstTimerId);
  }

  private emitFeedbackEvent(record: any) {
    const orgId = String(record.organizationId ?? '');
    if (orgId) {
      this.notifications.notifyFeedbackReceived(orgId, {
        id: String(record._id),
        visitorName: record.visitorName,
        channel: record.channel,
        deliveryStatus: record.deliveryStatus,
        organizationId: orgId,
      });
    }
  }
}
