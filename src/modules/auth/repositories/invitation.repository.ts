import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { Invitation, InvitationDocument } from '../schemas/invitation.schema';

@Injectable()
export class InvitationRepository extends BaseRepository<InvitationDocument> {
  constructor(
    @InjectModel(Invitation.name)
    invitationModel: Model<InvitationDocument>,
  ) {
    super(invitationModel);
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async findByOrganization(organizationId: string) {
    return this.model.find({ organizationId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }
}
