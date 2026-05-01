import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SmsService } from './sms.service';

interface SendOptions {
  channel: 'whatsapp' | 'sms';
  to: string;
  template: string;
  vars: Record<string, string>;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly sms: SmsService,
  ) {}

  resolveVariables(template: string, vars: Record<string, string>): string {
    return template.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => vars[key] ?? `{{${key}}}`,
    );
  }

  async sendToVisitor(options: SendOptions): Promise<boolean> {
    const message = this.resolveVariables(options.template, options.vars);
    if (options.channel === 'whatsapp') {
      return this.whatsapp.sendTextMessage(options.to, message);
    }
    if (options.channel === 'sms') {
      return this.sms.sendSms(options.to, message);
    }
    this.logger.warn(`Unsupported channel: ${options.channel}`);
    return false;
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
    }

    for (const item of waItems) {
      const ok = await this.whatsapp.sendTextMessage(
        item.to,
        this.resolveVariables(item.template, item.vars),
      );
      ok ? sent++ : failed++;
    }

    return { sent, failed };
  }
}
