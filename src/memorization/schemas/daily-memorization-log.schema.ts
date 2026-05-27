import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type DailyMemorizationLogDocument = DailyMemorizationLog & Document;

@Schema({ timestamps: true })
export class DailyMemorizationLog extends BaseSchema {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  date: string;

  @Prop({ default: 0 })
  versesReviewed: number;

  @Prop({ default: 0 })
  versesLearned: number;

  @Prop({ default: 0 })
  totalTimeSeconds: number;

  @Prop({ default: 0 })
  perfectCount: number;

  @Prop({ default: 0 })
  hesitantCount: number;

  @Prop({ default: 0 })
  failedCount: number;
}

export const DailyMemorizationLogSchema =
  SchemaFactory.createForClass(DailyMemorizationLog);
DailyMemorizationLogSchema.index({ userId: 1, date: 1 }, { unique: true });
DailyMemorizationLogSchema.index({ organizationId: 1, date: 1 });
