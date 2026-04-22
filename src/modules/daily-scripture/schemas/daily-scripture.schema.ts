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
}

export const DailyScriptureSchema =
  SchemaFactory.createForClass(DailyScripture);
