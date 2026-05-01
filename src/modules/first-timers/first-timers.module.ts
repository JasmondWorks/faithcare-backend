import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FirstTimer, FirstTimerSchema } from './schemas/first-timer.schema';
import { SecondTimer, SecondTimerSchema } from './schemas/second-timer.schema';
import { FirstTimerRepository } from './repositories/first-timer.repository';
import { SecondTimerRepository } from './repositories/second-timer.repository';
import { FirstTimerService } from './services/first-timer.service';
import { SecondTimerService } from './services/second-timer.service';
import { FollowUpSchedulerService } from './services/follow-up-scheduler.service';
import { FirstTimerController } from './controllers/first-timer.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FirstTimer.name, schema: FirstTimerSchema },
      { name: SecondTimer.name, schema: SecondTimerSchema },
    ]),
  ],
  controllers: [FirstTimerController],
  providers: [
    FirstTimerRepository,
    SecondTimerRepository,
    FirstTimerService,
    SecondTimerService,
    FollowUpSchedulerService,
  ],
  exports: [FirstTimerService, SecondTimerService],
})
export class FirstTimersModule {}
