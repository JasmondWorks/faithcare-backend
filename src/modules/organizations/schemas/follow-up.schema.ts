import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type FollowUpDocument = FollowUp & Document;

@Schema({ timestamps: true })
export class FollowUp extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FirstTimer', required: true })
  newMemberId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], enum: ['FIRST_TIMER'], default: ['FIRST_TIMER'] })
  tags: string[];

  @Prop({ enum: ['HIGH'], default: 'HIGH' })
  priority: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  dueDate: Date;
}

export const FollowUpSchema = SchemaFactory.createForClass(FollowUp);
