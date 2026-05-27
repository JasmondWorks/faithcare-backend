import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type VerseCollectionDocument = VerseCollection & Document;

@Schema({ timestamps: true })
export class VerseCollection extends BaseSchema {
  @Prop({ required: true })
  title: string;

  @Prop({ type: String, default: null })
  description?: string;

  @Prop({ required: true })
  theme: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Verse' }], default: [] })
  verseIds: Types.ObjectId[];

  @Prop({ required: true })
  organizationId: string;

  @Prop({ default: false })
  isGlobal: boolean;
}

export const VerseCollectionSchema = SchemaFactory.createForClass(VerseCollection);
VerseCollectionSchema.index({ organizationId: 1 });
VerseCollectionSchema.index({ isGlobal: 1, theme: 1 });
