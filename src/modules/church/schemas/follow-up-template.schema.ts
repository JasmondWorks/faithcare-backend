import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type FollowUpTemplateDocument = FollowUpTemplate & Document;

@Schema({ timestamps: true })
export class FollowUpTemplate extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['on_registration', 'day_3', 'day_7', 'manual'], default: 'manual' })
  trigger: string;

  @Prop({ enum: ['whatsapp', 'email', 'sms'], default: 'whatsapp' })
  channel: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: [String], default: [] })
  variables: string[];

  @Prop({ default: null })
  delayDays?: number;
}

export const FollowUpTemplateSchema =
  SchemaFactory.createForClass(FollowUpTemplate);
