import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'myNewSecurePassword1', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
