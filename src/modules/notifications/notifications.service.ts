import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: NotificationsGateway) {}

  notifyNewFirstTimer(organizationId: string, data: unknown): void {
    this.gateway.emitToRoom(
      `org:${organizationId}`,
      'first_timer_registered',
      data,
    );
  }

  notifyFollowUpDue(organizationId: string, data: unknown): void {
    this.gateway.emitToRoom(`org:${organizationId}`, 'follow_up_due', data);
  }

  notifyMessageSent(organizationId: string, data: unknown): void {
    this.gateway.emitToRoom(`org:${organizationId}`, 'message_sent', data);
  }
}
