import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  OrganizationUserSettings,
  OrganizationUserSettingsDocument,
} from '../schemas/organization-user-settings.schema';

@Injectable()
export class OrganizationUserSettingsRepository extends BaseRepository<OrganizationUserSettingsDocument> {
  constructor(
    @InjectModel(OrganizationUserSettings.name)
    orgUserSettingsModel: Model<OrganizationUserSettingsDocument>,
  ) {
    super(orgUserSettingsModel);
  }

  async findByUserAndOrg(userId: string, organizationId: string) {
    return this.model
      .findOne({ userId, organizationId, isDeleted: false })
      .exec();
  }
}
