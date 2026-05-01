import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  async sendTextMessage(to: string, message: string): Promise<boolean> {
    const token = this.config.get<string>('whatsapp.token');
    const phoneNumberId = this.config.get<string>('whatsapp.phoneNumberId');

    if (!token || !phoneNumberId) {
      this.logger.warn(
        'WhatsApp is not configured — WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing',
      );
      return false;
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/^\+/, ''),
      type: 'text',
      text: { body: message },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        this.logger.error(`WhatsApp send failed (${res.status}): ${error}`);
        return false;
      }

      this.logger.log(`WhatsApp message sent to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`WhatsApp network error: ${String(err)}`);
      return false;
    }
  }
}
