import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReadingPlanDocument = ReadingPlan & Document;

export enum ReadingPlanType {
  NT_90        = 'NT_90',
  PSALMS_30    = 'PSALMS_30',
  PROVERBS_31  = 'PROVERBS_31',
  GOSPELS_30   = 'GOSPELS_30',
  BIBLE_365    = 'BIBLE_365',
  CUSTOM       = 'CUSTOM',
}

@Schema({ timestamps: true })
export class ReadingPlan {
  @Prop({ required: true, enum: ReadingPlanType })
  type: ReadingPlanType;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  totalDays: number;

  @Prop({ required: true })
  chaptersPerDay: number;

  /** Ordered list of api.bible chapter IDs that make up this plan */
  @Prop({ type: [String], required: true })
  chapters: string[];

  @Prop({ default: true })
  isSystem: boolean;
}

export const ReadingPlanSchema = SchemaFactory.createForClass(ReadingPlan);
