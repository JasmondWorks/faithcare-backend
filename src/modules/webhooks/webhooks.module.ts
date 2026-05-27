import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import {
  FirstTimer,
  FirstTimerSchema,
} from '../first-timers/schemas/first-timer.schema';
import {
  FollowUp,
  FollowUpSchema,
} from '../organizations/schemas/follow-up.schema';
import { FollowUpRepository } from '../organizations/repositories/follow-up.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FirstTimer.name, schema: FirstTimerSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
    ]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, FollowUpRepository],
})
export class WebhooksModule {}
