import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BibleChapterCacheDocument = BibleChapterCache & Document;

export interface ParsedVerse {
  number: number;
  reference: string; // e.g. "GEN 1:1"
  text: string;
}

@Schema({ timestamps: true })
export class BibleChapterCache {
  @Prop({ required: true })
  bibleId: string;

  @Prop({ required: true })
  chapterId: string; // e.g. "GEN.1"

  @Prop({ required: true })
  reference: string; // e.g. "Genesis 1"

  @Prop({ required: true })
  rawHtml: string;

  @Prop({ type: [{ number: Number, reference: String, text: String }], default: [] })
  verses: ParsedVerse[];

  @Prop({ default: 0 })
  verseCount: number;

  @Prop({ type: String, default: null })
  nextChapterId: string | null;

  @Prop({ type: String, default: null })
  prevChapterId: string | null;
}

export const BibleChapterCacheSchema =
  SchemaFactory.createForClass(BibleChapterCache);

BibleChapterCacheSchema.index({ bibleId: 1, chapterId: 1 }, { unique: true });
