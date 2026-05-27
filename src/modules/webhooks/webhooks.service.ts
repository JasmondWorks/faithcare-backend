import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FirstTimer,
  FirstTimerDocument,
} from '../first-timers/schemas/first-timer.schema';
import { FollowUpRepository } from '../organizations/repositories/follow-up.repository';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly followUpRepo: FollowUpRepository,
    @InjectModel(FirstTimer.name)
    private readonly firstTimerModel: Model<FirstTimerDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Called when an inbound SMS or WhatsApp reply arrives from a contact.
   * Finds the most recently messaged follow-up for that phone number,
   * stores the reply, advances the status to REPLIED, and cascades to the
   * first-timer record if applicable.
   */
  async handleInboundMessage(from: string, message: string): Promise<void> {
    const followUps = await this.followUpRepo.findByContactPhone(from);
    if (!followUps.length) {
      this.logger.warn(
        `Inbound message from ${from}: no matching follow-up found`,
      );
      return;
    }

    const followUp = followUps[0] as any;
    const id = String(followUp._id);

    await this.followUpRepo.update(id, {
      receivedMessage: message,
      status: 'REPLIED',
    });

    if (followUp.targetType === 'first_timer' && followUp.targetId) {
      await this.firstTimerModel.findByIdAndUpdate(followUp.targetId, {
        status: 'FOLLOWED_UP',
      });
    }

    const orgId = String(followUp.organizationId ?? '');
    if (orgId) {
      this.notifications.notifyMessageSent(orgId, {
        followUpId: id,
        recipientName: followUp.contactName,
        channel: 'inbound_reply',
        delivered: true,
      });
    }

    this.logger.log(
      `Inbound reply from ${from} matched follow-up ${id} — status → REPLIED`,
    );
  }
}
