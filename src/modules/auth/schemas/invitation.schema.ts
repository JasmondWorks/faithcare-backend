import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { InvitationStatus } from '../enums/invitation-status.enum';

export type InvitationDocument = Invitation & Document;

@Schema({ timestamps: true })
export class Invitation extends BaseSchema {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  organizationId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Prop({ required: true })
  expiresAt: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);
