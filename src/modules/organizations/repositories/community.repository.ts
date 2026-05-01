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
    return this.model.find({ organizationId, isDeleted: false }).exec();
  }

  async findByUserInOrg(userId: string, organizationId: string) {
    return this.model
      .find({ organizationId, members: userId, isDeleted: false })
      .exec();
  }

  async addMember(communityId: string, userId: string) {
    return this.model
      .findByIdAndUpdate(
        communityId,
        { $addToSet: { members: userId } },
        { new: true },
      )
      .exec();
  }

  async removeMember(communityId: string, userId: string) {
    return this.model
      .findByIdAndUpdate(
        communityId,
        { $pull: { members: userId } },
        { new: true },
      )
      .exec();
  }

  async findRecentMembers(id: string) {
    const community = await this.model.findById(id).exec();
    if (!community) return null;
    return {
      ...community.toObject(),
      recentMembers: community.members.slice(-5),
    };
  }
}
