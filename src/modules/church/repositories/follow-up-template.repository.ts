import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  FollowUpTemplate,
  FollowUpTemplateDocument,
} from '../schemas/follow-up-template.schema';

@Injectable()
export class FollowUpTemplateRepository extends BaseRepository<FollowUpTemplateDocument> {
  constructor(
    @InjectModel(FollowUpTemplate.name)
    model: Model<FollowUpTemplateDocument>,
  ) {
    super(model);
  }

  async findByOrganization(organizationId: string) {
    return this.model.find({ organizationId, isDeleted: false }).exec();
  }
}
