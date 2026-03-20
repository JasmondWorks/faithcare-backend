import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalvationStatus } from 'src/core/enums/salvation-status.enum';

export class CreateSalvationRecordDto {
  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c1' })
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ example: 'Chukwuemeka Adeyemi' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '+2348098765432' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'emeka@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: '2026-03-16', description: 'ISO 8601 date: YYYY-MM-DD' })
  @IsString()
  decisionDate: string;

  @ApiPropertyOptional({ example: 'Gave his life to Christ after the Sunday service altar call.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: SalvationStatus, example: SalvationStatus.PENDING })
  @IsOptional()
  @IsEnum(SalvationStatus)
  status?: SalvationStatus;
}
