import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type FollowUpDocument = FollowUp & Document;

@Schema({ timestamps: true })
export class FollowUp extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FirstTimer', required: true })
  newMemberId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], enum: ['FIRST_TIMER'], default: ['FIRST_TIMER'] })
  tags: string[];

  @Prop({ type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' })
  priority: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  dueDate: Date;

  /**
   * PENDING   — task created, no message sent yet
   * CONTACTED — message sent and delivered
   * REPLIED   — visitor replied (receivedMessage logged)
   * CLOSED    — manually resolved without a reply
   */
  @Prop({
    type: String,
    enum: ['PENDING', 'CONTACTED', 'REPLIED', 'CLOSED'],
    default: 'PENDING',
  })
  status: string;

  // ── Messaging fields ────────────────────────────────────────────

  @Prop({ default: null })
  phoneNumber: string | null;

  @Prop({
    type: String,
    enum: ['whatsapp', 'sms', 'email', 'in_person'],
    default: 'whatsapp',
  })
  channel: string;

  /** Outbound message sent to the visitor. */
  @Prop({ default: null })
  sentMessage: string | null;

  /** Visitor's inbound reply, logged via PATCH /:id/reply. */
  @Prop({ default: null })
  receivedMessage: string | null;

  @Prop({
    type: String,
    enum: ['not_sent', 'sent', 'failed'],
    default: 'not_sent',
  })
  deliveryStatus: string;
}

export const FollowUpSchema = SchemaFactory.createForClass(FollowUp);
FollowUpSchema.index({ organizationId: 1, dueDate: 1 });
FollowUpSchema.index({ newMemberId: 1 });
