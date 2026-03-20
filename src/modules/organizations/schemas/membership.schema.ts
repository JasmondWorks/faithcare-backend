import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { MembershipRole } from 'src/core/enums/membership-role.enum';
import { MembershipStatus } from 'src/core/enums/membership-status.enum';
import { OrganizationRole } from 'src/core/enums/organization-role.enum';

export type MembershipDocument = Membership & Document;

@Schema({ timestamps: true })
export class Membership extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: String, enum: MembershipRole, default: MembershipRole.MEMBER })
  role: MembershipRole;

  @Prop({ type: String, enum: MembershipStatus, default: MembershipStatus.ACTIVE })
  status: MembershipStatus;

  @Prop({ type: String, enum: [...Object.values(OrganizationRole), null], default: null })
  organizationRole: OrganizationRole | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  invitedBy: Types.ObjectId | null;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);

// Prevent duplicate memberships — one row per user per org
MembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

// "All active members of an org" — used in every list-members query
MembershipSchema.index({ organizationId: 1, status: 1 });

// "All orgs this user belongs to" — used in /auth/switch-organization and /organizations/mine
MembershipSchema.index({ userId: 1, status: 1 });
