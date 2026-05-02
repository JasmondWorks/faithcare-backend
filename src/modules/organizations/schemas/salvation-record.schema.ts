import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { SalvationStatus } from 'src/core/enums/salvation-status.enum';

export type SalvationRecordDocument = SalvationRecord & Document;

@Schema({ timestamps: true })
export class SalvationRecord extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  phoneNumber?: string;

  @Prop({ type: String, default: null })
  email?: string;

  @Prop({ required: true })
  decisionDate: string;

  @Prop({ type: String, default: null })
  notes?: string;

  @Prop({
    type: String,
    enum: SalvationStatus,
    default: SalvationStatus.PENDING,
  })
  status: SalvationStatus;
}

export const SalvationRecordSchema =
  SchemaFactory.createForClass(SalvationRecord);
