import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  MessageTemplate,
  MessageTemplateDocument,
} from '../schemas/message-template.schema';

@Injectable()
export class MessageTemplateRepository extends BaseRepository<MessageTemplateDocument> {
  constructor(
    @InjectModel(MessageTemplate.name) model: Model<MessageTemplateDocument>,
  ) {
    super(model);
  }

  findByOrganization(organizationId: string) {
    return this.model
      .find({ $or: [{ organizationId, isDeleted: { $ne: true } }, { isPreset: true }] })
      .sort({ isPreset: -1, createdAt: -1 })
      .exec();
  }

  findPresets() {
    return this.model
      .find({ isPreset: true })
      .sort({ channel: 1, trigger: 1 })
      .exec();
  }

  findByOrgAndId(organizationId: string, id: string) {
    return this.model
      .findOne({ _id: id, organizationId, isDeleted: { $ne: true } })
      .exec();
  }

  upsertPreset(preset: Partial<MessageTemplate>) {
    return this.model
      .findOneAndUpdate(
        { isPreset: true, name: preset.name },
        { $setOnInsert: preset },
        { upsert: true, new: true },
      )
      .exec();
  }
}
