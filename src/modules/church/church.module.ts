import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageLog, MessageLogSchema } from './schemas/message-log.schema';
import {
  FirstTimer,
  FirstTimerSchema,
} from 'src/modules/first-timers/schemas/first-timer.schema';
import { MessageLogRepository } from './repositories/message-log.repository';
import { MessageLogService } from './services/message-log.service';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MessageLog.name, schema: MessageLogSchema },
      { name: FirstTimer.name, schema: FirstTimerSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [MessageLogRepository, MessageLogService, DashboardService],
  exports: [MessageLogService, DashboardService],
})
export class ChurchModule {}
