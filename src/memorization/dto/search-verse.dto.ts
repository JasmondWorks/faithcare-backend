import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchVerseDto {
  @ApiProperty({ description: 'Reference to search, e.g. "Philippians 4:13"' })
  @IsString()
  reference: string;

  @ApiPropertyOptional({
    enum: ['KJV', 'ASV', 'WEB'],
    default: 'KJV',
    description: 'Only public-domain translations are supported.',
  })
  @IsOptional()
  @IsEnum(['KJV', 'ASV', 'WEB'])
  translation?: 'KJV' | 'ASV' | 'WEB';
}
