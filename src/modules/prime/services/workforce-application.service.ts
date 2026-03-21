import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { WorkforceApplicationDocument } from '../schemas/workforce-application.schema';
import { WorkforceApplicationRepository } from '../repositories/workforce-application.repository';
import { CreateWorkforceApplicationDto } from '../dto/create-workforce-application.dto';

@Injectable()
export class WorkforceApplicationService extends BaseService<WorkforceApplicationDocument> {
  constructor(private workforceApplicationRepository: WorkforceApplicationRepository) {
    super(workforceApplicationRepository);
  }

  apply(dto: CreateWorkforceApplicationDto) {
    return this.workforceApplicationRepository.create(dto);
  }
}
