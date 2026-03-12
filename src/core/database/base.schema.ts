import { Prop } from '@nestjs/mongoose';

// Base schema for all schemas
// Gives fields like:
// isDeleted (false default)
// deletedAt (null default)

export class BaseSchema {
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt?: Date;
}
