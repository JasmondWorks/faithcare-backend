import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type FollowUpDocument = FollowUp & Document;

@Schema({ timestamps: true })
export class FollowUp extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  /**
   * Who this follow-up is for.
   * 'first_timer'  → links to a FirstTimer record (first visit)
   * 'second_timer' → links to a SecondTimer record (second visit)
   * 'member'       → links to a Member record (regular attendee)
   * null           → ad-hoc follow-up with no linked record
   */
  @Prop({
    type: String,
    enum: ['first_timer', 'second_timer', 'member'],
    default: null,
  })
  targetType: string | null;

  @Prop({ default: false })
  isFirstTimer: boolean;

  @Prop({ default: false })
  isSecondTimer: boolean;

  @Prop({ type: Types.ObjectId, default: null })
  targetId: Types.ObjectId | null;

  /** Denormalized — always populated regardless of targetType. */
  @Prop({ required: true })
  contactName: string;

  @Prop({ required: true })
  contactPhone: string;

  @Prop({
    type: [String],
    enum: ['FIRST_TIMER', 'MEMBER', 'OTHER'],
    default: [],
  })
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
   * REPLIED   — visitor/member replied (receivedMessage logged)
   * CLOSED    — manually resolved without a reply
   */
  @Prop({
    type: String,
    enum: ['PENDING', 'CONTACTED', 'REPLIED', 'CLOSED'],
    default: 'PENDING',
  })
  status: string;

  // ── Messaging fields ────────────────────────────────────────────

  @Prop({
    type: String,
    enum: ['whatsapp', 'sms', 'email', 'in_person'],
    default: 'whatsapp',
  })
  channel: string;

  @Prop({ default: null })
  sentMessage: string | null;

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
FollowUpSchema.index({ organizationId: 1, dueDate: 1, status: 1 });
FollowUpSchema.index({ targetId: 1 });
