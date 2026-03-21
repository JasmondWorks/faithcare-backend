import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WorkforceApplication,
  WorkforceApplicationSchema,
} from './schemas/workforce-application.schema';
import {
  TrybeApplication,
  TrybeApplicationSchema,
} from './schemas/trybe-application.schema';
import {
  PrimePrayerRequest,
  PrimePrayerRequestSchema,
} from './schemas/prime-prayer-request.schema';
import { WorkforceApplicationRepository } from './repositories/workforce-application.repository';
import { TrybeApplicationRepository } from './repositories/trybe-application.repository';
import { PrimePrayerRequestRepository } from './repositories/prime-prayer-request.repository';
import { WorkforceApplicationService } from './services/workforce-application.service';
import { TrybeApplicationService } from './services/trybe-application.service';
import { PrimePrayerRequestService } from './services/prime-prayer-request.service';
import { PrimeController } from './controllers/prime.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkforceApplication.name, schema: WorkforceApplicationSchema },
      { name: TrybeApplication.name, schema: TrybeApplicationSchema },
      { name: PrimePrayerRequest.name, schema: PrimePrayerRequestSchema },
    ]),
  ],
  controllers: [PrimeController],
  providers: [
    WorkforceApplicationRepository,
    TrybeApplicationRepository,
    PrimePrayerRequestRepository,
    WorkforceApplicationService,
    TrybeApplicationService,
    PrimePrayerRequestService,
  ],
})
export class PrimeModule {}
