import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { FocusTimerStatus } from 'src/core/enums/focus-timer-status.enum';

export type FocusTimerDocument = FocusTimer & Document;

@Schema({ timestamps: true })
export class FocusTimer extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  duration: number;

  @Prop({
    type: String,
    enum: FocusTimerStatus,
    default: FocusTimerStatus.NOT_STARTED,
  })
  status: FocusTimerStatus;

  @Prop({ default: 0 })
  currentProgress: number;
}

export const FocusTimerSchema = SchemaFactory.createForClass(FocusTimer);
