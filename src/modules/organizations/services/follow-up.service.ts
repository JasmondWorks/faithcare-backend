import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { MessagingService } from 'src/core/services/messaging.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FollowUpDocument } from '../schemas/follow-up.schema';
import { FollowUpRepository } from '../repositories/follow-up.repository';
import { SendFollowUpMessageDto } from '../dto/send-follow-up-message.dto';

@Injectable()
export class FollowUpService extends BaseService<FollowUpDocument> {
  constructor(
    private followUpRepository: FollowUpRepository,
    private messaging: MessagingService,
    private notifications: NotificationsService,
  ) {
    super(followUpRepository);
  }

  findByOrganization(organizationId: string) {
    return this.followUpRepository.findByOrganization(organizationId);
  }

  findByMember(newMemberId: string) {
    return this.followUpRepository.findByMember(newMemberId);
  }

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
    });

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

  async logReply(
    id: string,
    receivedMessage: string,
  ): Promise<FollowUpDocument | null> {
    const record = await this.followUpRepository.findById(id);
    if (!record) throw new NotFoundException('Follow-up not found');
    return this.followUpRepository.update(id, { receivedMessage });
  }
}
