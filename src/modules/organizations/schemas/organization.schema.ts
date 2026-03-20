import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { Denomination } from 'src/core/enums/denomination.enum';
import { MemberCountRange } from 'src/core/enums/member-count-range.enum';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: Denomination, required: true })
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

  @Prop({ default: null })
  websiteUrl?: string;

  @Prop({ enum: MemberCountRange, required: true })
  memberCountRange: MemberCountRange;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
