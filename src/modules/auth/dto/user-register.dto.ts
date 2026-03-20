import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRegisterDto {
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
