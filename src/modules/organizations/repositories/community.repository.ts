import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { Community, CommunityDocument } from '../schemas/community.schema';

@Injectable()
export class CommunityRepository extends BaseRepository<CommunityDocument> {
  constructor(
    @InjectModel(Community.name)
    communityModel: Model<CommunityDocument>,
  ) {
    super(communityModel);
  }

  async findByOrganization(organizationId: string) {
    return this.model
      .find({ organizationId, isDeleted: { $ne: true } })
      .populate('members', 'name phoneNumber email status')
      .exec();
  }

  async findByIdWithMembers(id: string) {
    return this.model
      .findById(id)
      .populate<{ members: { name: string; phoneNumber: string; email: string | null }[] }>(
        'members',
        'name phoneNumber email',
      )
      .exec();
  }

  async addMember(communityId: string, memberId: string) {
    return this.model
      .findByIdAndUpdate(
        communityId,
        { $addToSet: { members: memberId } },
        { new: true },
      )
      .populate('members', 'name phoneNumber email status')
      .exec();
  }

  async removeMember(communityId: string, memberId: string) {
    return this.model
      .findByIdAndUpdate(
        communityId,
        { $pull: { members: memberId } },
        { new: true },
      )
      .populate('members', 'name phoneNumber email status')
      .exec();
  }

  async findRecentMembers(id: string) {
    const community = await this.model
      .findById(id)
      .populate('members', 'name phoneNumber email status')
      .exec();
    if (!community) return null;
    const allMembers = community.members as any[];
    return {
      ...community.toObject(),
      recentMembers: allMembers.slice(-5),
    };
  }
}
