import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { MemberDocument } from '../schemas/member.schema';
import { MemberRepository } from '../repositories/member.repository';

@Injectable()
export class MemberService extends BaseService<MemberDocument> {
  constructor(private readonly memberRepository: MemberRepository) {
    super(memberRepository);
  }

  findByOrganization(organizationId: string) {
    return this.memberRepository.findByOrganization(organizationId);
  }

  searchByName(organizationId: string, query: string) {
    return this.memberRepository.searchByName(organizationId, query);
  }
}
