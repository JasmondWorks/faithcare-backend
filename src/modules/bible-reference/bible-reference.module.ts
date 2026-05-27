import { Module } from '@nestjs/common';
import { BibleReferenceController } from './bible-reference.controller';
import { BibleReferenceService } from './bible-reference.service';

@Module({
  controllers: [BibleReferenceController],
  providers: [BibleReferenceService],
  exports: [BibleReferenceService],
})
export class BibleReferenceModule {}
