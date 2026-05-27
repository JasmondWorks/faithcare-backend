import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type VerseDocument = Verse & Document;

@Schema({ timestamps: true })
export class Verse extends BaseSchema {
  @Prop({ required: true })
  reference: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  translation: string;

  @Prop({ type: String, default: null })
  audioUrl?: string;

  @Prop({ required: true })
  organizationId: string;
}

export const VerseSchema = SchemaFactory.createForClass(Verse);
VerseSchema.index({ reference: 1, translation: 1 });
