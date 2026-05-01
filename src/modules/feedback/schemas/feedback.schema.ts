import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FirstTimer', default: null })
  firstTimerId: Types.ObjectId | null;

  @Prop({ required: true })
  visitorName: string;

  @Prop({ required: true })
  sentMessage: string;

  @Prop({ required: true })
  receivedMessage: string;

  @Prop({
    type: String,
    enum: ['whatsapp', 'sms', 'email', 'in_person'],
    required: true,
  })
  channel: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ organizationId: 1, createdAt: -1 });
FeedbackSchema.index({ firstTimerId: 1 });
