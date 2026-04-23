import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRegisterDto {
  @ApiPropertyOptional({
    enum: ['auth'],
    default: 'auth',
    description:
      'Auth provider — always "auth" for email/password registration',
  })
  @IsOptional()
  @IsString()
  @IsIn(['auth'])
  provider?: 'auth';

  @ApiProperty({ example: 'David Okafor' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'david@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepassword1', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}
