import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type CommunityDocument = Community & Document;

@Schema({ timestamps: true })
export class Community extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  members: Types.ObjectId[];

  @Prop({ default: null })
  profileImage?: string;
}

export const CommunitySchema = SchemaFactory.createForClass(Community);
