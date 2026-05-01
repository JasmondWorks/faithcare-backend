import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MessageTemplate,
  MessageTemplateSchema,
} from './schemas/message-template.schema';
import { MessageTemplateRepository } from './repositories/message-template.repository';
import { MessageTemplateService } from './services/message-template.service';
import { MessageTemplateController } from './controllers/message-template.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MessageTemplate.name, schema: MessageTemplateSchema },
    ]),
  ],
  controllers: [MessageTemplateController],
  providers: [MessageTemplateRepository, MessageTemplateService],
  exports: [MessageTemplateService],
})
export class MessageTemplatesModule {}
