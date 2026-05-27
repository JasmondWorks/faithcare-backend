import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type MemorizationGroupDocument = MemorizationGroup & Document;

@Schema({ timestamps: true })
export class MemorizationGroup extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ type: [String], default: [] })
  memberIds: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'VerseCollection' }], default: [] })
  collectionIds: Types.ObjectId[];
}

export const MemorizationGroupSchema = SchemaFactory.createForClass(MemorizationGroup);
MemorizationGroupSchema.index({ organizationId: 1 });
