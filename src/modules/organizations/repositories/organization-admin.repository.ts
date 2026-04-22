import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  OrganizationAdmin,
  OrganizationAdminDocument,
} from '../schemas/organization-admin.schema';

@Injectable()
export class OrganizationAdminRepository extends BaseRepository<OrganizationAdminDocument> {
  constructor(
    @InjectModel(OrganizationAdmin.name)
    orgAdminModel: Model<OrganizationAdminDocument>,
  ) {
    super(orgAdminModel);
  }

  async findByOrganization(organizationId: string) {
    return this.model.find({ organizationId, isDeleted: false }).exec();
  }

  async findByUser(userId: string) {
    return this.model.find({ userId, isDeleted: false }).exec();
  }
}
