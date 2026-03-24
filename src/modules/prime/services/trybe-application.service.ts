import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { TrybeApplicationDocument } from '../schemas/trybe-application.schema';
import { TrybeApplicationRepository } from '../repositories/trybe-application.repository';
import { CreateTrybeApplicationDto } from '../dto/create-trybe-application.dto';

@Injectable()
export class TrybeApplicationService extends BaseService<TrybeApplicationDocument> {
  constructor(private trybeApplicationRepository: TrybeApplicationRepository) {
    super(trybeApplicationRepository);
  }

  apply(dto: CreateTrybeApplicationDto) {
    return this.trybeApplicationRepository.create(dto);
  }
}
