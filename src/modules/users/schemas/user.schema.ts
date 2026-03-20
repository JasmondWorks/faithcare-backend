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

  @Prop({ enum: Role, default: Role.USER })
  role: Role;

  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  organizationId: Types.ObjectId | null;

  @Prop({ type: String, enum: [...Object.values(OrganizationRole), null], default: null })
  organizationRole: OrganizationRole | null;

  @Prop({ default: false })
  isEmailVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
