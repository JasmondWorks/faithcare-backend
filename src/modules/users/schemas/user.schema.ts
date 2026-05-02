import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { Role } from 'src/core/enums/role.enum';

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

  /** ADMIN accounts must be verified by the org creator or ≥2 existing admins before accessing the dashboard. */
  @Prop({ default: true })
  isAdminVerified: boolean;

  /** Set when admin submits an organization application. Cleared on approval/rejection. */
  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  pendingOrganizationId: Types.ObjectId | null;

  /** True when a super_admin invited this user. Frontend redirects to change-password on first login. */
  @Prop({ default: false })
  isInvited: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
