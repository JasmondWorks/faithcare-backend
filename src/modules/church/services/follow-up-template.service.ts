import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { FollowUpTemplateDocument } from '../schemas/follow-up-template.schema';
import { FollowUpTemplateRepository } from '../repositories/follow-up-template.repository';

@Injectable()
export class FollowUpTemplateService extends BaseService<FollowUpTemplateDocument> {
  constructor(private followUpTemplateRepository: FollowUpTemplateRepository) {
    super(followUpTemplateRepository);
  }

  async findByOrganization(organizationId: string) {
    return this.followUpTemplateRepository.findByOrganization(organizationId);
  }
}
