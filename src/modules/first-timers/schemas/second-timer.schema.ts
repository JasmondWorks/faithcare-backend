import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type SecondTimerDocument = SecondTimer & Document;

@Schema({ timestamps: true })
export class SecondTimer extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FirstTimer', required: true })
  firstTimerId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: null })
  prayerRequest?: string;

  @Prop({
    type: String,
    enum: ['FIRST_TIMER', 'SECOND_TIMER'],
    default: 'SECOND_TIMER',
  })
  status: 'FIRST_TIMER' | 'SECOND_TIMER';
}

export const SecondTimerSchema = SchemaFactory.createForClass(SecondTimer);
