import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({ example: 'david@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['email_verification', 'password_reset'] })
  @IsEnum(['email_verification', 'password_reset'])
  type: 'email_verification' | 'password_reset';
}
