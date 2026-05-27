import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSecondTimerDto {

  @ApiProperty({
    example: '64a1f2c3e4b5d6e7f8a9b0c2',
    description: 'ID of the original first-timer record',
  })
  @IsMongoId()
  firstTimerId: string;

  @ApiProperty({ example: 'Amara Nwosu' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+2349087654321' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'amara@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Trusting God for a new job opportunity.' })
  @IsOptional()
  @IsString()
  prayerRequest?: string;

  @ApiPropertyOptional({
    enum: ['FIRST_TIMER', 'SECOND_TIMER'],
    example: 'SECOND_TIMER',
  })
  @IsOptional()
  @IsEnum(['FIRST_TIMER', 'SECOND_TIMER'])
  status?: 'FIRST_TIMER' | 'SECOND_TIMER';
}
