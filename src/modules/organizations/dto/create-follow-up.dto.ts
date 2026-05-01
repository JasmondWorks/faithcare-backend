import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFollowUpDto {
  @ApiPropertyOptional({
    example: 'first_timer',
    enum: ['first_timer', 'member'],
    description:
      'Type of the contact this follow-up is for. Omit for ad-hoc follow-ups.',
  })
  @IsOptional()
  @IsEnum(['first_timer', 'member'])
  targetType?: 'first_timer' | 'member';

  @ApiPropertyOptional({
    example: '64a1f2c3e4b5d6e7f8a9b0c2',
    description: 'ID of the linked FirstTimer or Member record.',
  })
  @IsOptional()
  @IsMongoId()
  targetId?: string;

  @ApiProperty({
    example: 'Amara Nwosu',
    description: 'Contact name — always required',
  })
  @IsString()
  contactName: string;

  @ApiProperty({
    example: '+2348012345678',
    description: 'Contact phone — always required',
  })
  @IsString()
  contactPhone: string;

  @ApiPropertyOptional({
    example: ['FIRST_TIMER'],
    enum: ['FIRST_TIMER', 'MEMBER', 'OTHER'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['FIRST_TIMER', 'MEMBER', 'OTHER'], { each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' })
  @IsOptional()
  @IsEnum(['HIGH', 'MEDIUM', 'LOW'])
  priority?: string;

  @ApiProperty({
    example:
      'First-time visitor who expressed interest in joining a cell group.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: '2026-04-01',
    description: 'ISO 8601 date: YYYY-MM-DD',
  })
  @IsDateString()
  dueDate: string;
}
