import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { CommunityDocument } from '../schemas/community.schema';
import { CommunityRepository } from '../repositories/community.repository';

@Injectable()
export class CommunityService extends BaseService<CommunityDocument> {
  constructor(private communityRepository: CommunityRepository) {
    super(communityRepository);
  }

  async findByOrganization(organizationId: string) {
    return this.communityRepository.findByOrganization(organizationId);
  }

  async findWithRecentMembers(id: string) {
    return this.communityRepository.findRecentMembers(id);
  }
}
