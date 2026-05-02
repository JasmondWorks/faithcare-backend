import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  Organization,
  OrganizationDocument,
} from '../schemas/organization.schema';

@Injectable()
export class OrganizationRepository extends BaseRepository<OrganizationDocument> {
  constructor(
    @InjectModel(Organization.name)
    organizationModel: Model<OrganizationDocument>,
  ) {
    super(organizationModel);
  }

  async findByCreator(createdBy: string) {
    return this.model.find({ createdBy, isDeleted: { $ne: true } }).exec();
  }

  async searchBySlug(slug: string) {
    return this.model
      .find({ slug: { $regex: slug, $options: 'i' }, isDeleted: { $ne: true } })
      .limit(20)
      .exec();
  }
}
