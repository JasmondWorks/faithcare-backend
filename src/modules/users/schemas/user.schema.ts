import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { Role } from 'src/core/enums/role.enum';
import { OrganizationRole } from 'src/core/enums/organization-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;

  @Prop({ default: false })
  isEmailVerified: boolean;

  /** ADMIN accounts must be verified by the org creator or ≥2 existing admins. */
  @Prop({ default: true })
  isAdminVerified: boolean;

  /**
   * For ADMINs: the organization they own or manage.
   * Set when admin creates an org OR when their application is approved.
   * Used to populate organizationId in the login response.
   */
  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  organizationId: Types.ObjectId | null;

  /** True when this admin created the organization (vs joined via application/invite). */
  @Prop({ default: false })
  isOrgCreator: boolean;

  /**
   * For individual USERs: true once their UserMetaData record is created.
   * For ADMINs: true once organizationId is set.
   * Frontend uses this to decide whether to show the onboarding flow.
   */
  @Prop({ default: false })
  isOnboarded: boolean;

  /** Set while admin's application is pending; cleared on approval/rejection. */
  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  pendingOrganizationId: Types.ObjectId | null;

  /** True when a super_admin invited this user. Frontend redirects to change-password. */
  @Prop({ default: false })
  isInvited: boolean;

  /** The specific role/title within an organization (e.g. Senior Pastor). */
  @Prop({ type: String, enum: OrganizationRole, default: null })
  organizationRole: OrganizationRole | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
