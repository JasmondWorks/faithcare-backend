import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type DailyScriptureDocument = DailyScripture & Document;

@Schema({ timestamps: true })
export class DailyScripture extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  scriptureReference: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  /** Personal reflection note the user wrote about this passage */
  @Prop({ type: String, default: null })
  personalNotes: string | null;

  /** api.bible chapter ID, present when reading from a plan */
  @Prop({ type: String, default: null })
  chapterId: string | null;

  /** api.bible translation/bible ID used for this entry */
  @Prop({ type: String, default: null })
  bibleId: string | null;

  /** Links back to the user's active reading plan record */
  @Prop({ type: Types.ObjectId, ref: 'UserReadingPlan', default: null })
  userReadingPlanId: Types.ObjectId | null;

  /** Day number within the plan (1-based) */
  @Prop({ type: Number, default: null })
  planDay: number | null;
}

export const DailyScriptureSchema =
  SchemaFactory.createForClass(DailyScripture);
