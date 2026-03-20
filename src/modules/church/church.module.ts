import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FollowUpTemplate,
  FollowUpTemplateSchema,
} from './schemas/follow-up-template.schema';
import { MessageLog, MessageLogSchema } from './schemas/message-log.schema';
import {
  FirstTimer,
  FirstTimerSchema,
} from 'src/modules/first-timers/schemas/first-timer.schema';
import { FollowUpTemplateRepository } from './repositories/follow-up-template.repository';
import { MessageLogRepository } from './repositories/message-log.repository';
import { FollowUpTemplateService } from './services/follow-up-template.service';
import { MessageLogService } from './services/message-log.service';
import { DashboardService } from './services/dashboard.service';
import { FollowUpController } from './controllers/follow-up.controller';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FollowUpTemplate.name, schema: FollowUpTemplateSchema },
      { name: MessageLog.name, schema: MessageLogSchema },
      { name: FirstTimer.name, schema: FirstTimerSchema },
    ]),
  ],
  controllers: [FollowUpController, DashboardController],
  providers: [
    FollowUpTemplateRepository,
    MessageLogRepository,
    FollowUpTemplateService,
    MessageLogService,
    DashboardService,
  ],
  exports: [FollowUpTemplateService, MessageLogService, DashboardService],
})
export class ChurchModule {}
