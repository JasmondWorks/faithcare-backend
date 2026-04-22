import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { Membership, MembershipDocument } from '../schemas/membership.schema';
import { MembershipStatus } from 'src/core/enums/membership-status.enum';

@Injectable()
export class MembershipRepository extends BaseRepository<MembershipDocument> {
  constructor(
    @InjectModel(Membership.name)
    membershipModel: Model<MembershipDocument>,
  ) {
    super(membershipModel);
  }

  findByOrganization(organizationId: string) {
    return this.model
      .find({
        organization: organizationId,
        status: MembershipStatus.ACTIVE,
        isDeleted: false,
      })
      .populate('userId', 'name email role createdAt')
      .exec();
  }

  findByUser(userId: string) {
    return this.model
      .find({ userId, status: MembershipStatus.ACTIVE, isDeleted: false })
      .populate('organization')
      .exec();
  }

  findByUserAndOrg(userId: string, organizationId: string) {
    return this.model
      .findOne({ userId, organization: organizationId, isDeleted: false })
      .exec();
  }

  findActiveMembership(userId: string, organizationId: string) {
    return this.model
      .findOne({
        userId,
        organization: organizationId,
        status: MembershipStatus.ACTIVE,
        isDeleted: false,
      })
      .exec();
  }
}
