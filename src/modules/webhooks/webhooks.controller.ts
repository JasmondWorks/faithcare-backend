import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/core/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Public()
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  // ── WhatsApp (Meta Cloud API) ────────────────────────────────────

  @Get('whatsapp')
  @ApiOperation({
    summary: 'WhatsApp webhook verification (Meta challenge)',
    description:
      'Meta calls this once when you register the webhook URL. ' +
      'Set `WHATSAPP_VERIFY_TOKEN` to any secret string, then use the same value in the Meta Webhook settings.',
  })
  @ApiResponse({ status: 200, description: 'Challenge echoed back — webhook verified' })
  @ApiResponse({ status: 403, description: 'Token mismatch — webhook rejected' })
  verifyWhatsApp(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.get<string>('whatsapp.verifyToken');
    if (mode === 'subscribe' && token === expected) {
      return res.status(HttpStatus.OK).send(challenge);
    }
    return res.status(HttpStatus.FORBIDDEN).send();
  }

  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive inbound WhatsApp messages from Meta',
    description:
      'Meta POSTs here when a contact replies to a WhatsApp message. ' +
      'The matching follow-up record is updated (receivedMessage + status → REPLIED).',
  })
  @ApiResponse({ status: 200, description: 'Received' })
  async receiveWhatsApp(@Body() body: any) {
    // Always return 200 — if we return 5xx Meta will retry indefinitely.
    try {
      for (const entry of body?.entry ?? []) {
        for (const change of entry?.changes ?? []) {
          for (const msg of change?.value?.messages ?? []) {
            if (msg.type === 'text') {
              await this.webhooksService.handleInboundMessage(
                String(msg.from),
                String(msg.text?.body ?? ''),
              );
            }
          }
        }
      }
    } catch (err) {
      // Log but swallow — never let an exception reach Meta
      console.error('WhatsApp webhook error:', err);
    }
    return { received: true };
  }

  // ── Termii SMS ───────────────────────────────────────────────────

  @Post('sms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive inbound SMS replies from Termii',
    description:
      'Termii POSTs here when a contact replies to an SMS. ' +
      'Configure this URL in your Termii dashboard → Settings → Webhook.',
  })
  @ApiResponse({ status: 200, description: 'Received' })
  async receiveTermiiSms(@Body() body: any) {
    try {
      // Termii inbound payload uses various field names depending on version
      const from =
        body?.msisdn ?? body?.from ?? body?.sender ?? body?.mobile ?? '';
      const message =
        body?.message ?? body?.text ?? body?.sms ?? body?.data?.message ?? '';
      if (from && message) {
        await this.webhooksService.handleInboundMessage(
          String(from),
          String(message),
        );
      }
    } catch (err) {
      console.error('SMS webhook error:', err);
    }
    return { received: true };
  }
}
