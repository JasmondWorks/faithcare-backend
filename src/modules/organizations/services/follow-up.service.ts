import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from 'src/core/services/base.service';
import { MessagingService } from 'src/core/services/messaging.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import {
  FirstTimer,
  FirstTimerDocument,
} from 'src/modules/first-timers/schemas/first-timer.schema';
import { FollowUpDocument } from '../schemas/follow-up.schema';
import { FollowUpRepository } from '../repositories/follow-up.repository';
import { SendFollowUpMessageDto } from '../dto/send-follow-up-message.dto';

@Injectable()
export class FollowUpService extends BaseService<FollowUpDocument> {
  constructor(
    private followUpRepository: FollowUpRepository,
    private messaging: MessagingService,
    private notifications: NotificationsService,
    @InjectModel(FirstTimer.name)
    private firstTimerModel: Model<FirstTimerDocument>,
  ) {
    super(followUpRepository);
  }

  findByOrganization(organizationId: string) {
    return this.followUpRepository.findByOrganization(organizationId);
  }

  findByMember(newMemberId: string) {
    return this.followUpRepository.findByMember(newMemberId);
  }

  /**
   * Send a WhatsApp or SMS message to the visitor linked to this follow-up.
   * On success:
   *   - FollowUp.status → CONTACTED, deliveryStatus → sent
   *   - FirstTimer.status → CONTACTED
   * On failure:
   *   - FollowUp.deliveryStatus → failed (status stays PENDING so it's retryable)
   */
  async sendMessage(
    id: string,
    dto: SendFollowUpMessageDto,
  ): Promise<FollowUpDocument & { delivered: boolean }> {
    const record = await this.followUpRepository.findById(id);
    if (!record) throw new NotFoundException('Follow-up not found');

    const delivered = await this.messaging.sendToVisitor({
      channel: dto.channel,
      to: dto.phoneNumber,
      template: dto.message,
      vars: {},
      organizationId: String((record as any).organizationId),
      recipientName: (record as any).name,
    });

    const updated = await this.followUpRepository.update(id, {
      phoneNumber: dto.phoneNumber,
      channel: dto.channel,
      sentMessage: dto.message,
      deliveryStatus: delivered ? 'sent' : 'failed',
      status: delivered ? 'CONTACTED' : 'PENDING',
    });

    if (delivered) {
      await this.firstTimerModel.findByIdAndUpdate(
        (record as any).newMemberId,
        { status: 'CONTACTED' },
      );
    }

    const orgId = String((record as any).organizationId ?? '');
    if (orgId) {
      this.notifications.notifyMessageSent(orgId, {
        followUpId: id,
        recipientName: (record as any).name,
        channel: dto.channel,
        delivered,
      });
    }

    return Object.assign(updated ?? record, { delivered });
  }

  /**
   * Log the visitor's inbound reply.
   * On call:
   *   - FollowUp.status → REPLIED
   *   - FirstTimer.status → FOLLOWED_UP
   */
  async logReply(
    id: string,
    receivedMessage: string,
  ): Promise<FollowUpDocument | null> {
    const record = await this.followUpRepository.findById(id);
    if (!record) throw new NotFoundException('Follow-up not found');

    const updated = await this.followUpRepository.update(id, {
      receivedMessage,
      status: 'REPLIED',
    });

    await this.firstTimerModel.findByIdAndUpdate((record as any).newMemberId, {
      status: 'FOLLOWED_UP',
    });

    return updated;
  }
}
