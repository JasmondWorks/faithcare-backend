import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type UserMetaDataDocument = UserMetaData & Document;

export class SpiritualGoals {
  dailyBibleReading: boolean;
  dailyPrayer: boolean;
  consistentPrayerLife: boolean;
  scriptureMemorization: boolean;
  scripturalJournaling: boolean;
  betterTimeManagement: boolean;
  deeperFaith: boolean;
}

@Schema({ timestamps: true })
export class UserMetaData extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: null })
  location?: string;

  @Prop({ default: null })
  churchName?: string;

  @Prop({ type: [Object], default: null })
  spiritualGoals?: SpiritualGoals[] | null;

  @Prop({ type: Types.ObjectId, ref: 'FocusTimer', default: null })
  currentFocusTimerId: Types.ObjectId | null;

  @Prop({ default: 0 })
  dailyBibleReadingStreakCount: number;
}

export const UserMetaDataSchema = SchemaFactory.createForClass(UserMetaData);
