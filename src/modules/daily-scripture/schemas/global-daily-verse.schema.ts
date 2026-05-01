import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GlobalDailyVerseDocument = GlobalDailyVerse & Document;

@Schema({ timestamps: true })
export class GlobalDailyVerse {
  @Prop({ required: true, unique: true })
  date: string;

  @Prop({ required: true })
  reference: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: 'KJV' })
  version: string;
}

export const GlobalDailyVerseSchema =
  SchemaFactory.createForClass(GlobalDailyVerse);
