import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserLoginDto {
  @ApiPropertyOptional({
    enum: ['auth'],
    default: 'auth',
    description: 'Auth provider — always "auth" for email/password login',
  })
  @IsOptional()
  @IsString()
  @IsIn(['auth'])
  provider?: 'auth';

  @ApiProperty({ example: 'david@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepassword1' })
  @IsString()
  password: string;
}
