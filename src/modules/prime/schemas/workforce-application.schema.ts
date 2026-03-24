import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';
import { Department } from 'src/core/enums/department.enum';

export type WorkforceApplicationDocument = WorkforceApplication & Document;

const PRIME_ORG_ID = new Types.ObjectId('69bd8cd5ec1a44c866c52113');

@Schema({ timestamps: true, collection: 'prime_workforce_applications' })
export class WorkforceApplication extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Organization', default: () => PRIME_ORG_ID })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  haveServedInADepartment: boolean;

  @Prop({ type: [String], enum: Object.values(Department), required: true })
  departmentToServeIn: Department[];
}

export const WorkforceApplicationSchema = SchemaFactory.createForClass(WorkforceApplication);
