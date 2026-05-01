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

  async findByUserInOrg(userId: string, organizationId: string) {
    return this.communityRepository.findByUserInOrg(userId, organizationId);
  }

  async findWithRecentMembers(id: string) {
    return this.communityRepository.findRecentMembers(id);
  }

  async addMember(communityId: string, userId: string) {
    return this.communityRepository.addMember(communityId, userId);
  }

  async removeMember(communityId: string, userId: string) {
    return this.communityRepository.removeMember(communityId, userId);
  }
}
