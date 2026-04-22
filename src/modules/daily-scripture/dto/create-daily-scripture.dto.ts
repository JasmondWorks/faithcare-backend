import {
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDailyScriptureDto {
  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c1' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: 'Trust in the Lord' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Proverbs 3:5-6' })
  @IsString()
  scriptureReference: string;

  @ApiProperty({
    example: '2026-03-20',
    description: 'ISO 8601 date: YYYY-MM-DD',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example:
      'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
