import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { PrimePrayerRequestDocument } from '../schemas/prime-prayer-request.schema';
import { PrimePrayerRequestRepository } from '../repositories/prime-prayer-request.repository';
import { CreatePrimePrayerRequestDto } from '../dto/create-prime-prayer-request.dto';

@Injectable()
export class PrimePrayerRequestService extends BaseService<PrimePrayerRequestDocument> {
  constructor(
    private primePrayerRequestRepository: PrimePrayerRequestRepository,
  ) {
    super(primePrayerRequestRepository);
  }

  submit(dto: CreatePrimePrayerRequestDto) {
    return this.primePrayerRequestRepository.create(dto);
  }
}
