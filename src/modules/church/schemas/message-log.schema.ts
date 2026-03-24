import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type MessageLogDocument = MessageLog & Document;

@Schema({ timestamps: true })
export class MessageLog extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FirstTimer', required: true })
  firstTimerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FollowUpTemplate', required: true })
  templateId: Types.ObjectId;

  @Prop({ type: String, enum: ['whatsapp', 'email', 'sms'], required: true })
  channel: string;

  @Prop({
    type: String,
    enum: ['queued', 'sent', 'delivered', 'failed'],
    default: 'queued',
  })
  status: string;

  @Prop({ default: null })
  sentAt?: Date;

  @Prop({ default: null })
  errorMessage?: string;
}

export const MessageLogSchema = SchemaFactory.createForClass(MessageLog);
