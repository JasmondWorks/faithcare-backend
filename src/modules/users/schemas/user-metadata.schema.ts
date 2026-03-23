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

/**
 * Exactly one of `name` or `organizationId` will be non-null:
 *   name           → user typed a church name not found in the system
 *   organizationId → user selected an existing Organization record
 */
export class ChurchInfo {
  name: string | null;
  organizationId: Types.ObjectId | null;
}

@Schema({ timestamps: true })
export class UserMetaData extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: null })
  location?: string;

  @Prop({
    type: {
      name: { type: String, default: null },
      organizationId: { type: Types.ObjectId, ref: 'Organization', default: null },
    },
    default: () => ({ name: null, organizationId: null }),
    _id: false,
  })
  church: ChurchInfo;

  @Prop({ type: [Object], default: null })
  spiritualGoals?: SpiritualGoals[] | null;

  @Prop({ type: Types.ObjectId, ref: 'FocusTimer', default: null })
  currentFocusTimerId: Types.ObjectId | null;

  @Prop({ default: 0 })
  dailyBibleReadingStreakCount: number;
}

export const UserMetaDataSchema = SchemaFactory.createForClass(UserMetaData);
