import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type FirstTimerDocument = FirstTimer & Document;

@Schema({ timestamps: true })
export class FirstTimer extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ default: null })
  email?: string;

  @Prop({ default: null })
  prayerRequest?: string;

  @Prop({ enum: ['first_time', 'second_time'], default: 'first_time' })
  visitType: 'first_time' | 'second_time';

  @Prop({ type: Types.ObjectId, ref: 'FirstTimer', default: null })
  firstTimerId?: Types.ObjectId | null;

  @Prop({ enum: ['PENDING', 'CONTACTED', 'FOLLOWED_UP'], default: 'PENDING' })
  status: 'PENDING' | 'CONTACTED' | 'FOLLOWED_UP';

  @Prop({ default: null })
  serviceDate?: string;

  @Prop({ default: null })
  notes?: string;

  @Prop({ default: null })
  followUpScheduledAt?: Date;
}

export const FirstTimerSchema = SchemaFactory.createForClass(FirstTimer);
