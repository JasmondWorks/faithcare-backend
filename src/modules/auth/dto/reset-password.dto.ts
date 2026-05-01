import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'david@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '482931',
    description: '6-digit OTP sent to your email',
  })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'newSecurePassword1', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
