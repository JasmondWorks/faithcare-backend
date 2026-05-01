import { Global, Module } from '@nestjs/common';
import { WhatsappService } from './services/whatsapp.service';
import { SmsService } from './services/sms.service';
import { MessagingService } from './services/messaging.service';

@Global()
@Module({
  providers: [WhatsappService, SmsService, MessagingService],
  exports: [WhatsappService, SmsService, MessagingService],
})
export class CoreMessagingModule {}
