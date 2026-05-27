import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  // ── Active implementation: Termii WhatsApp channel ──────────────────────────

  private get apiKey(): string {
    return this.config.get<string>('termii.apiKey') ?? '';
  }

  private get senderId(): string {
    return this.config.get<string>('termii.senderId') ?? 'FaithCare';
  }

  private get baseUrl(): string {
    return this.config.get<string>('termii.baseUrl') ?? 'https://api.ng.termii.com/api';
  }

  async sendTextMessage(
    to: string,
    message: string,
  ): Promise<{ ok: boolean; providerError?: string }> {
    if (!this.apiKey) {
      const providerError = 'WhatsApp not configured — TERMII_API_KEY missing';
      this.logger.warn(providerError);
      return { ok: false, providerError };
    }

    // Termii expects the number without the leading '+' (e.g. 2348012345678)
    const normalised = to.replace(/^\+/, '');

    try {
      const res = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          to: normalised,
          from: this.senderId,
          sms: message,
          type: 'plain',
          channel: 'whatsapp',
        }),
      });

      const body = await res.text();

      if (!res.ok) {
        const providerError = `Termii WhatsApp ${res.status}: ${body}`;
        this.logger.error(`WhatsApp send failed — ${providerError}`);
        return { ok: false, providerError };
      }

      this.logger.log(`WhatsApp (Termii) message sent to ${to}`);
      return { ok: true };
    } catch (err) {
      const providerError = `WhatsApp network error: ${String(err)}`;
      this.logger.error(providerError);
      return { ok: false, providerError };
    }
  }

  // ── Preserved: direct Meta Cloud API (not active) ───────────────────────────
  // Kept for reference in case Meta Business registration is completed later.
  // To reactivate: swap sendTextMessage() body to call _sendViaMeta() instead.
  //
  // Required env vars:
  //   WHATSAPP_TOKEN          — permanent system-user token from Meta Business Manager
  //   WHATSAPP_PHONE_NUMBER_ID — Meta → WhatsApp → Getting Started
  //
  // private async _sendViaMeta(
  //   to: string,
  //   message: string,
  // ): Promise<{ ok: boolean; providerError?: string }> {
  //   const token = this.config.get<string>('whatsapp.token');
  //   const phoneNumberId = this.config.get<string>('whatsapp.phoneNumberId');
  //
  //   if (!token || !phoneNumberId) {
  //     return { ok: false, providerError: 'WhatsApp not configured — WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing' };
  //   }
  //
  //   const res = await fetch(
  //     `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
  //     {
  //       method: 'POST',
  //       headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         messaging_product: 'whatsapp',
  //         to: to.replace(/^\+/, ''),
  //         type: 'text',
  //         text: { body: message },
  //       }),
  //     },
  //   );
  //
  //   const body = await res.text();
  //   if (!res.ok) return { ok: false, providerError: `Meta ${res.status}: ${body}` };
  //   return { ok: true };
  // }
}
