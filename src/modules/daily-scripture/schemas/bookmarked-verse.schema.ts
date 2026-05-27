import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookmarkedVerseDocument = BookmarkedVerse & Document;

@Schema({ timestamps: true })
export class BookmarkedVerse {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  bibleId: string;

  @Prop({ required: true })
  chapterId: string; // e.g. "GEN.1"

  @Prop({ required: true })
  verseReference: string; // e.g. "GEN 1:1"

  @Prop({ required: true })
  verseText: string;

  @Prop({ type: String, default: null })
  note: string | null;
}

export const BookmarkedVerseSchema =
  SchemaFactory.createForClass(BookmarkedVerse);

BookmarkedVerseSchema.index({ userId: 1, verseReference: 1, bibleId: 1 });
