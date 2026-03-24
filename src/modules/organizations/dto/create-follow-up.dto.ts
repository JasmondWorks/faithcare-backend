import { IsArray, IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFollowUpDto {
  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c1' })
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c2' })
  @IsMongoId()
  newMemberId: string;

  @ApiProperty({ example: 'Amara Nwosu' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: ['FIRST_TIMER'], enum: ['FIRST_TIMER'], isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(['FIRST_TIMER'], { each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['HIGH'], example: 'HIGH' })
  @IsOptional()
  @IsEnum(['HIGH'])
  priority?: string;

  @ApiProperty({ example: 'First-time visitor who expressed interest in joining a cell group.' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2026-04-01', description: 'ISO 8601 date: YYYY-MM-DD' })
  @IsDateString()
  dueDate: string;
}
