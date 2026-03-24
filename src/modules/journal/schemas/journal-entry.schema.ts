import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type JournalEntryDocument = JournalEntry & Document;

@Schema({ timestamps: true })
export class JournalEntry extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: null })
  scriptureReference?: string;

  @Prop({ required: true })
  content: string;
}

export const JournalEntrySchema = SchemaFactory.createForClass(JournalEntry);
