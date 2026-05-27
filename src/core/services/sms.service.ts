import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SmsRecipient {
  to: string;
  sms: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string {
    return this.config.get<string>('termii.apiKey') ?? '';
  }

  private get senderId(): string {
    return this.config.get<string>('termii.senderId') ?? 'FaithCare';
  }

  private get baseUrl(): string {
    return (
      this.config.get<string>('termii.baseUrl') ??
      'https://api.ng.termii.com/api'
    );
  }

  async sendSms(
    to: string,
    message: string,
  ): Promise<{ ok: boolean; providerError?: string }> {
    if (!this.apiKey) {
      const providerError = 'SMS not configured — TERMII_API_KEY missing';
      this.logger.warn(providerError);
      return { ok: false, providerError };
    }

    try {
      const res = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          from: this.senderId,
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: this.apiKey,
        }),
      });

      const body = await res.text();

      if (!res.ok) {
        const providerError = `Termii ${res.status}: ${body}`;
        this.logger.error(`SMS send failed — ${providerError}`);
        return { ok: false, providerError };
      }

      this.logger.log(`SMS sent to ${to} — ${body}`);
      return { ok: true };
    } catch (err) {
      const providerError = `SMS network error: ${String(err)}`;
      this.logger.error(providerError);
      return { ok: false, providerError };
    }
  }

  async sendBulkSms(
    recipients: SmsRecipient[],
  ): Promise<{ sent: number; failed: number }> {
    if (!this.apiKey) {
      this.logger.warn('Bulk SMS not configured — TERMII_API_KEY missing');
      return { sent: 0, failed: recipients.length };
    }

    try {
      const res = await fetch(`${this.baseUrl}/sms/send/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients.map((r) => r.to),
          from: this.senderId,
          sms: recipients[0]?.sms ?? '',
          type: 'plain',
          channel: 'generic',
          api_key: this.apiKey,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        this.logger.error(`Bulk SMS failed (${res.status}): ${error}`);
        return { sent: 0, failed: recipients.length };
      }

      this.logger.log(`Bulk SMS sent to ${recipients.length} recipients`);
      return { sent: recipients.length, failed: 0 };
    } catch (err) {
      this.logger.error(`Bulk SMS network error: ${String(err)}`);
      return { sent: 0, failed: recipients.length };
    }
  }
}
