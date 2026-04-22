import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type OrganizationUserSettingsDocument = OrganizationUserSettings &
  Document;

export class NotificationSettings {
  newFirstTimers: boolean;
  newPrayerRequests: boolean;
  pendingFollowUpReminders: boolean;
}

@Schema({ timestamps: true })
export class OrganizationUserSettings extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({
    type: Object,
    default: {
      newFirstTimers: true,
      newPrayerRequests: true,
      pendingFollowUpReminders: true,
    },
  })
  notifications: NotificationSettings;

  @Prop({ type: String, enum: ['LIGHT', 'DARK'], default: 'LIGHT' })
  theme: 'LIGHT' | 'DARK';

  @Prop({ default: false })
  is2FAEnabled: boolean;

  @Prop({ type: String, enum: ['EN', 'FR'], default: 'EN' })
  language: 'EN' | 'FR';

  @Prop({ type: String, enum: ['WAT', 'ET'], default: 'WAT' })
  timeZone: 'WAT' | 'ET';
}

export const OrganizationUserSettingsSchema = SchemaFactory.createForClass(
  OrganizationUserSettings,
);
