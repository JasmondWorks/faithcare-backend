import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { FollowUpDocument } from '../schemas/follow-up.schema';
import { FollowUpRepository } from '../repositories/follow-up.repository';

@Injectable()
export class FollowUpService extends BaseService<FollowUpDocument> {
  constructor(private followUpRepository: FollowUpRepository) {
    super(followUpRepository);
  }

  async findByOrganization(organizationId: string) {
    return this.followUpRepository.findByOrganization(organizationId);
  }

  async findByMember(newMemberId: string) {
    return this.followUpRepository.findByMember(newMemberId);
  }
}
