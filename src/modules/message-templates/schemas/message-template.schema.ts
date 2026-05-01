import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type MessageTemplateDocument = MessageTemplate & Document;

@Schema({ timestamps: true })
export class MessageTemplate extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  organizationId: Types.ObjectId | null;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: ['whatsapp', 'sms', 'email'], required: true })
  channel: string;

  @Prop({
    type: String,
    enum: ['on_registration', 'day_1', 'day_3', 'day_7', 'manual'],
    default: 'manual',
  })
  trigger: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: [String], default: [] })
  variables: string[];

  @Prop({ default: false })
  isPreset: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const MessageTemplateSchema =
  SchemaFactory.createForClass(MessageTemplate);
MessageTemplateSchema.index({ organizationId: 1, isActive: 1 });
MessageTemplateSchema.index({ isPreset: 1 });
