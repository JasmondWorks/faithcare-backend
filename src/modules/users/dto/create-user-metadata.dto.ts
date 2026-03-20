import { IsArray, IsBoolean, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
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
  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c1' })
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional({ example: 'Lagos, Nigeria' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5d6e7f8a9b0c1', description: 'ID of the organization (church) the user belongs to' })
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiPropertyOptional({ type: () => SpiritualGoalsDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpiritualGoalsDto)
  spiritualGoals?: SpiritualGoalsDto[];

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  dailyBibleReadingStreakCount?: number;
}
