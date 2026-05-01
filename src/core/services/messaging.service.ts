import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SmsService } from './sms.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

export interface SendOptions {
  channel: 'whatsapp' | 'sms';
  to: string;
  template: string;
  vars: Record<string, string>;
  organizationId?: string;
  recipientName?: string;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly sms: SmsService,
    private readonly notifications: NotificationsService,
  ) {}

  resolveVariables(template: string, vars: Record<string, string>): string {
    return template.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => vars[key] ?? `{{${key}}}`,
    );
  }

  async sendToVisitor(options: SendOptions): Promise<boolean> {
    const message = this.resolveVariables(options.template, options.vars);
    let ok = false;

    if (options.channel === 'whatsapp') {
      ok = await this.whatsapp.sendTextMessage(options.to, message);
    } else if (options.channel === 'sms') {
      ok = await this.sms.sendSms(options.to, message);
    }

    if (ok && options.organizationId) {
      this.notifications.notifyMessageSent(options.organizationId, {
        channel: options.channel,
        to: options.to,
        recipientName: options.recipientName,
        status: 'sent',
      });
    }

    return ok;
  }

  async sendBulk(
    items: SendOptions[],
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const smsItems = items.filter((i) => i.channel === 'sms');
    const waItems = items.filter((i) => i.channel === 'whatsapp');

    if (smsItems.length > 0) {
      const result = await this.sms.sendBulkSms(
        smsItems.map((i) => ({
          to: i.to,
          sms: this.resolveVariables(i.template, i.vars),
        })),
      );
      sent += result.sent;
      failed += result.failed;

      const orgId = smsItems[0]?.organizationId;
      if (orgId && result.sent > 0) {
        this.notifications.notifyMessageSent(orgId, {
          channel: 'sms',
          count: result.sent,
          status: 'bulk_sent',
        });
      }
    }

    for (const item of waItems) {
      const ok = await this.whatsapp.sendTextMessage(
        item.to,
        this.resolveVariables(item.template, item.vars),
      );
      if (ok) {
        sent++;
        if (item.organizationId) {
          this.notifications.notifyMessageSent(item.organizationId, {
            channel: 'whatsapp',
            to: item.to,
            recipientName: item.recipientName,
            status: 'sent',
          });
        }
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }
}
