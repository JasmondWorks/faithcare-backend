import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { OrganizationAdminDocument } from '../schemas/organization-admin.schema';
import { OrganizationAdminRepository } from '../repositories/organization-admin.repository';

@Injectable()
export class OrganizationAdminService extends BaseService<OrganizationAdminDocument> {
  constructor(private orgAdminRepository: OrganizationAdminRepository) {
    super(orgAdminRepository);
  }

  async findByOrganization(organizationId: string) {
    return this.orgAdminRepository.findByOrganization(organizationId);
  }

  async findByUser(userId: string) {
    return this.orgAdminRepository.findByUser(userId);
  }
}
