import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@primechurch.org' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'your_secure_password' })
  @IsString()
  password: string;
}
