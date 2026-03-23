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

  /**
   * Set when the user selects an existing church from search.
   * Populated on read with full Organization details.
   */
  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  organization: Types.ObjectId | null;

  /**
   * Set when the user's church is not found in the system.
   * Mutually exclusive with `organization`.
   */
  @Prop({ type: String, default: null })
  churchName: string | null;

  @Prop({ type: [Object], default: null })
  spiritualGoals?: SpiritualGoals[] | null;

  @Prop({ type: Types.ObjectId, ref: 'FocusTimer', default: null })
  currentFocusTimerId: Types.ObjectId | null;

  @Prop({ default: 0 })
  dailyBibleReadingStreakCount: number;
}

export const UserMetaDataSchema = SchemaFactory.createForClass(UserMetaData);
