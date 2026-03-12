import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Role {
  @Prop({ unique: true })
  name: string;

  @Prop({ type: [String] })
  permissions: string[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
