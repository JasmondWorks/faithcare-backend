import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserReadingPlanDocument = UserReadingPlan & Document;

export type PlanStatus = 'active' | 'paused' | 'completed';

@Schema({ timestamps: true })
export class UserReadingPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ReadingPlan', required: true })
  planId: Types.ObjectId;

  /** api.bible ID for the user's chosen translation */
  @Prop({ required: true })
  translationId: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ type: String, enum: ['active', 'paused', 'completed'], default: 'active' })
  status: PlanStatus;

  /** Day number when the plan was paused — resumes from here */
  @Prop({ type: Number, default: null })
  pausedOnDay: number | null;
}

export const UserReadingPlanSchema =
  SchemaFactory.createForClass(UserReadingPlan);

UserReadingPlanSchema.index({ userId: 1, status: 1 });
