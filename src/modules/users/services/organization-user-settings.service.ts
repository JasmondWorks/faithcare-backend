import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { OrganizationUserSettingsDocument } from '../schemas/organization-user-settings.schema';
import { OrganizationUserSettingsRepository } from '../repositories/organization-user-settings.repository';

@Injectable()
export class OrganizationUserSettingsService extends BaseService<OrganizationUserSettingsDocument> {
  constructor(
    private orgUserSettingsRepository: OrganizationUserSettingsRepository,
  ) {
    super(orgUserSettingsRepository);
  }

  async findByUserAndOrg(userId: string, organizationId: string) {
    return this.orgUserSettingsRepository.findByUserAndOrg(userId, organizationId);
  }
}
