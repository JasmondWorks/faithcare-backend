import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'David Okafor' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'david@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepassword1' })
  @IsString()
  password: string;
}
