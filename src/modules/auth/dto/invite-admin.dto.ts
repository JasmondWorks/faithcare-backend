import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteAdminDto {
  @ApiProperty({ example: 'Grace Okafor' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'grace@example.com' })
  @IsEmail()
  email: string;
}
