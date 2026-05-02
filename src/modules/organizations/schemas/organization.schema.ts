import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { Denomination } from 'src/core/enums/denomination.enum';
import { MemberCountRange } from 'src/core/enums/member-count-range.enum';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization extends BaseSchema {
  @Prop({ required: true })
  name: string;

  // URL-safe unique handle, e.g. "prime-church-lagos" — used for tenant resolution
  @Prop({ unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true })
  email: string;

  // Stored for audit trail; access control is governed entirely by Membership
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: String, enum: Denomination, required: true })
  denomination: Denomination;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  zipCode: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ type: String, default: null })
  websiteUrl?: string;

  @Prop({ type: String, enum: MemberCountRange, required: true })
  memberCountRange: MemberCountRange;

  // Base64 PNG data URI of the QR code for the first-timer registration page.
  // Encodes { organizationId, slug, name } so the public form can fetch org details.
  @Prop({ type: String, default: null })
  firstTimerQrCode?: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
