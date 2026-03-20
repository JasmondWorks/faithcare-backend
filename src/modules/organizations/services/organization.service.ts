import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { OrganizationDocument } from '../schemas/organization.schema';
import { OrganizationRepository } from '../repositories/organization.repository';

@Injectable()
export class OrganizationService extends BaseService<OrganizationDocument> {
  constructor(private organizationRepository: OrganizationRepository) {
    super(organizationRepository);
  }

  async findByCreator(createdBy: string) {
    return this.organizationRepository.findByCreator(createdBy);
  }
}
