import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpiritualGoalsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  dailyBibleReading: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  dailyPrayer: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  consistentPrayerLife: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  scriptureMemorization: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  scripturalJournaling: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  betterTimeManagement: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  deeperFaith: boolean;
}

export class CreateUserMetaDataDto {
  @ApiPropertyOptional({ example: 'Lagos, Nigeria' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 'Grace Chapel Abuja',
    description:
      'Free-text church name. Provide this when the church is not found in the system.',
  })
  @IsOptional()
  @IsString()
  churchName?: string;

  @ApiPropertyOptional({ type: () => SpiritualGoalsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpiritualGoalsDto)
  spiritualGoals?: SpiritualGoalsDto;

  // @ApiPropertyOptional({ example: 7 })
  // @IsOptional()
  // @IsNumber()
  // dailyBibleReadingStreakCount?: number;
}
