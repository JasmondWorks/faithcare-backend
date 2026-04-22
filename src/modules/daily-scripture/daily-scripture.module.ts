import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyScripture,
  DailyScriptureSchema,
} from './schemas/daily-scripture.schema';
import { DailyScriptureRepository } from './repositories/daily-scripture.repository';
import { DailyScriptureService } from './services/daily-scripture.service';
import { DailyScriptureController } from './controllers/daily-scripture.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyScripture.name, schema: DailyScriptureSchema },
    ]),
  ],
  controllers: [DailyScriptureController],
  providers: [DailyScriptureRepository, DailyScriptureService],
  exports: [DailyScriptureService],
})
export class DailyScriptureModule {}
