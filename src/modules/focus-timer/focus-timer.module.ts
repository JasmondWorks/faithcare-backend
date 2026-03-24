import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FocusTimer, FocusTimerSchema } from './schemas/focus-timer.schema';
import { FocusTimerRepository } from './repositories/focus-timer.repository';
import { FocusTimerService } from './services/focus-timer.service';
import { FocusTimerController } from './controllers/focus-timer.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FocusTimer.name, schema: FocusTimerSchema },
    ]),
  ],
  controllers: [FocusTimerController],
  providers: [FocusTimerRepository, FocusTimerService],
  exports: [FocusTimerService],
})
export class FocusTimerModule {}
