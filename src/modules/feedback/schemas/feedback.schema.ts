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
  phoneNumber: string;

  @Prop({
    type: String,
    enum: ['whatsapp', 'sms', 'email', 'in_person'],
    required: true,
  })
  channel: string;

  /** Message sent outbound to the visitor. Null if visitor initiated first. */
  @Prop({ default: null })
  sentMessage: string | null;

  /** Visitor's inbound reply. Populated via PATCH /feedback/:id/reply. */
  @Prop({ default: null })
  receivedMessage: string | null;

  /** Whether the outbound message was delivered. 'not_sent' for manual/in-person logs. */
  @Prop({
    type: String,
    enum: ['not_sent', 'sent', 'failed'],
    default: 'not_sent',
  })
  deliveryStatus: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ organizationId: 1, createdAt: -1 });
FeedbackSchema.index({ firstTimerId: 1 });
