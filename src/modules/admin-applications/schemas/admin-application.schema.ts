import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type AdminApplicationDocument = AdminApplication & Document;

@Schema({ timestamps: true })
export class AdminApplication extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  applicantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  })
  status: string;

  /** IDs of admins who approved this application. Approval granted when org creator approves OR length ≥ 2. */
  @Prop({ type: [{ adminId: Types.ObjectId, approvedAt: Date }], default: [] })
  approvals: { adminId: Types.ObjectId; approvedAt: Date }[];

  @Prop({ default: null })
  rejectionReason: string | null;

  @Prop({ required: true })
  expiresAt: Date;
}

export const AdminApplicationSchema =
  SchemaFactory.createForClass(AdminApplication);
AdminApplicationSchema.index({ applicantId: 1 });
AdminApplicationSchema.index({ organizationId: 1, status: 1 });
AdminApplicationSchema.index({ expiresAt: 1, status: 1 });
