import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFirstTimerDto {
  @ApiProperty({ description: 'Organization ID this visitor belongs to' })
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ example: 'Amara Nwosu' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+2349087654321', description: 'E.164 format' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'amara@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Trusting God for a new job opportunity.' })
  @IsOptional()
  @IsString()
  prayerRequest?: string;

  @ApiProperty({ enum: ['first_time', 'second_time'], example: 'first_time' })
  @IsEnum(['first_time', 'second_time'])
  visitType: 'first_time' | 'second_time';

  @ApiPropertyOptional({ description: 'Reference to the original first-timer (for second visits)' })
  @IsOptional()
  @IsMongoId()
  firstTimerId?: string;

  @ApiProperty({ example: '2025-07-06', description: 'ISO 8601 date: YYYY-MM-DD' })
  @IsString()
  serviceDate: string;
}
