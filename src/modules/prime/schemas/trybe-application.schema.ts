import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { Gender } from 'src/core/enums/gender.enum';
import { TrybeMembershipStatus } from 'src/core/enums/trybe-membership-status.enum';
import { TrybeIntent } from 'src/core/enums/trybe-intent.enum';
import { TrybeCategory } from 'src/core/enums/trybe-category.enum';

export type TrybeApplicationDocument = TrybeApplication & Document;

const PRIME_ORG_ID = new Types.ObjectId('69bd8cd5ec1a44c866c52113');

@Schema({ timestamps: true })
export class TrybeApplication extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', default: () => PRIME_ORG_ID })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  email: string;

  @Prop({ type: String, enum: Gender, required: true })
  gender: Gender;

  @Prop({ type: String, enum: TrybeMembershipStatus, required: true })
  isAMember: TrybeMembershipStatus;

  @Prop({ required: true })
  skills: string;

  @Prop({ type: String, enum: TrybeIntent, required: true })
  whatWouldYouLikeToDo: TrybeIntent;

  @Prop({ required: true })
  whyWouldYouLikeToJoin: string;

  @Prop({ type: String, enum: TrybeCategory, required: true })
  whichTrybeCategoryToJoin: TrybeCategory;
}

export const TrybeApplicationSchema = SchemaFactory.createForClass(TrybeApplication);
