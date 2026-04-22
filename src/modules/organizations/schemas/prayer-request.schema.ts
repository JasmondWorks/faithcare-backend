import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { PrayerRequestStatus } from 'src/core/enums/prayer-request-status.enum';

export type PrayerRequestDocument = PrayerRequest & Document;

@Schema({ timestamps: true })
export class PrayerRequest extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: PrayerRequestStatus,
    default: PrayerRequestStatus.PENDING,
  })
  status: PrayerRequestStatus;

  @Prop({ required: true })
  description: string;
}

export const PrayerRequestSchema = SchemaFactory.createForClass(PrayerRequest);
