import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { PrayerRequestStatus } from 'src/core/enums/prayer-request-status.enum';

export type PrimePrayerRequestDocument = PrimePrayerRequest & Document;

const PRIME_ORG_ID = new Types.ObjectId('69bd8cd5ec1a44c866c52113');

@Schema({ timestamps: true, collection: 'prime_prayer_requests' })
export class PrimePrayerRequest extends BaseSchema {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    default: () => PRIME_ORG_ID,
  })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  prayerRequest: string;

  @Prop({
    type: String,
    enum: PrayerRequestStatus,
    default: PrayerRequestStatus.PENDING,
  })
  status: PrayerRequestStatus;
}

export const PrimePrayerRequestSchema =
  SchemaFactory.createForClass(PrimePrayerRequest);
