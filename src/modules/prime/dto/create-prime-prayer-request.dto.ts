import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class CreatePrimePrayerRequestDto {
  @ApiProperty({ example: 'Emmanuel Bello' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'emmanuel@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Please pray for my family and my business breakthrough.',
  })
  @IsString()
  prayerRequest: string;
}
