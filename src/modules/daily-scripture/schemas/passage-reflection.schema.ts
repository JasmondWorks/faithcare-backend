import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PassageReflectionDocument = PassageReflection & Document;

export interface MemoryVerse {
  reference: string;
  text: string;
}

@Schema({ timestamps: true })
export class PassageReflection {
  @Prop({ required: true, unique: true })
  chapterId: string; // e.g. "GEN.1" — one reflection per chapter regardless of translation

  @Prop({ required: true })
  theme: string;

  @Prop({ required: true })
  context: string; // 2-sentence background

  @Prop({ type: [String], default: [] })
  reflectionQuestions: string[];

  @Prop({ required: true })
  prayerPrompt: string;

  @Prop({ required: true })
  application: string;

  @Prop({
    type: { reference: String, text: String },
    required: true,
  })
  memoryVerse: MemoryVerse;
}

export const PassageReflectionSchema =
  SchemaFactory.createForClass(PassageReflection);
