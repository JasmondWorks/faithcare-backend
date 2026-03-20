import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { Role } from 'src/core/enums/role.enum';

export type OrganizationAdminDocument = OrganizationAdmin & Document;

@Schema({ timestamps: true })
export class OrganizationAdmin extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: Role, default: Role.ORGANIZATION_ADMIN })
  role: Role;
}

export const OrganizationAdminSchema =
  SchemaFactory.createForClass(OrganizationAdmin);
