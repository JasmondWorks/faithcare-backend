import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  hashedOtp: string;

  @Prop({ enum: ['email_verification', 'password_reset'], required: true })
  type: 'email_verification' | 'password_reset';

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Auto-delete expired OTPs via MongoDB TTL index
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
