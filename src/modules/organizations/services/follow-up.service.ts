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

  findByOrganization(
    organizationId: string,
    filters?: { status?: string; type?: string },
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.followUpRepository.findByOrganization(organizationId, filters, pagination);
  }

  findByTarget(targetId: string) {
    return this.followUpRepository.findByMember(targetId);
  }

  /**
   * Returns a chronological message thread for a specific contact target.
   * Each entry shows the outbound sent message and the contact's reply,
   * together with channel, delivery status, and timestamps.
   */
  async getConversation(targetId: string) {
    const followUps = await this.followUpRepository.findByMember(targetId);
    return followUps
      .filter((f: any) => f.sentMessage || f.receivedMessage)
      .map((f: any) => ({
        followUpId: String(f._id),
        contactName: f.contactName,
        isFirstTimer: f.isFirstTimer ?? false,
        isSecondTimer: f.isSecondTimer ?? false,
        channel: f.channel,
        sentMessage: f.sentMessage ?? null,
        receivedMessage: f.receivedMessage ?? null,
        deliveryStatus: f.deliveryStatus,
        status: f.status,
        sentAt: f.updatedAt,
        createdAt: f.createdAt,
      }));
  }

  /**
   * Send a WhatsApp or SMS for this follow-up.
   * On delivery success:
   *   - FollowUp.status → CONTACTED, deliveryStatus → sent
   *   - If targetType === 'first_timer': FirstTimer.status → CONTACTED
   * On failure:
   *   - deliveryStatus → failed, status stays PENDING (retryable)
   */
  async sendMessage(
    id: string,
    dto: SendFollowUpMessageDto,
  ): Promise<FollowUpDocument & { delivered: boolean }> {
    const record = await this.followUpRepository.findById(id);
    if (!record) throw new NotFoundException('Follow-up not found');

    const { delivered, providerError } = await this.messaging.sendToVisitor({
      channel: dto.channel,
      to: (dto.contactPhone ??
        dto.phoneNumber ??
        (record as any).contactPhone) as string,
      template: dto.message,
      vars: {},
      organizationId: String((record as any).organizationId),
      recipientName: (record as any).contactName,
    });

    const updated = await this.followUpRepository.update(id, {
      channel: dto.channel,
      sentMessage: dto.message,
      deliveryStatus: delivered ? 'sent' : 'failed',
      status: delivered ? 'CONTACTED' : 'PENDING',
    });

    if (
      delivered &&
      (record as any).targetType === 'first_timer' &&
      (record as any).targetId
    ) {
      await this.firstTimerModel.findByIdAndUpdate((record as any).targetId, {
        status: 'CONTACTED',
      });
    }

    const orgId = String((record as any).organizationId ?? '');
    if (orgId) {
      this.notifications.notifyMessageSent(orgId, {
        followUpId: id,
        recipientName: (record as any).contactName,
        channel: dto.channel,
        delivered,
      });
    }

    const doc = updated ?? record;
    const plain = (doc as any).toObject ? (doc as any).toObject() : { ...doc };
    return {
      ...plain,
      delivered,
      ...(providerError ? { deliveryError: providerError } : {}),
    } as any;
  }

  /**
   * Log the contact's inbound reply.
   * FollowUp.status → REPLIED
   * If targetType === 'first_timer': FirstTimer.status → FOLLOWED_UP
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

    if (
      (record as any).targetType === 'first_timer' &&
      (record as any).targetId
    ) {
      await this.firstTimerModel.findByIdAndUpdate((record as any).targetId, {
        status: 'FOLLOWED_UP',
      });
    }

    return updated;
  }
}
