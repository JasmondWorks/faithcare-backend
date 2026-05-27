import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { CommunityDocument } from '../schemas/community.schema';
import { CommunityRepository } from '../repositories/community.repository';
import { MessagingService } from 'src/core/services/messaging.service';

@Injectable()
export class CommunityService extends BaseService<CommunityDocument> {
  constructor(
    private communityRepository: CommunityRepository,
    private readonly messaging: MessagingService,
  ) {
    super(communityRepository);
  }

  async findByOrganization(organizationId: string) {
    return this.communityRepository.findByOrganization(organizationId);
  }

  async findWithRecentMembers(id: string) {
    return this.communityRepository.findRecentMembers(id);
  }

  async addMember(communityId: string, memberId: string) {
    return this.communityRepository.addMember(communityId, memberId);
  }

  async removeMember(communityId: string, memberId: string) {
    return this.communityRepository.removeMember(communityId, memberId);
  }

  async broadcastMessage(
    communityId: string,
    channel: 'whatsapp' | 'sms',
    message: string,
    organizationId: string,
  ): Promise<{ sent: number; failed: number; totalMembers: number }> {
    const community = await this.communityRepository.findByIdWithMembers(communityId);
    if (!community) throw new NotFoundException('Community not found');

    const members = community.members as { name: string; phoneNumber: string }[];
    if (!members.length) return { sent: 0, failed: 0, totalMembers: 0 };

    const items = members
      .filter((m) => m.phoneNumber)
      .map((m) => ({
        channel,
        to: m.phoneNumber,
        template: message,
        vars: {},
        organizationId,
        recipientName: m.name,
      }));

    const result = await this.messaging.sendBulk(items);
    return { ...result, totalMembers: members.length };
  }
}
