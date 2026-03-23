import { IsArray, IsBoolean, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested, ValidateIf } from 'class-validator';
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

export class ChurchDto {
  @ApiPropertyOptional({
    example: 'Grace Chapel',
    description: 'Church name — provide this when the church is NOT found in the system',
  })
  @ValidateIf((o) => !o.organizationId)
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({
    example: '64a1f2c3e4b5d6e7f8a9b0c1',
    description: 'Organization ID — provide this when the user selects an existing church from search results',
  })
  @ValidateIf((o) => !o.name)
  @IsOptional()
  @IsMongoId()
  organizationId?: string | null;
}

export class CreateUserMetaDataDto {
  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c1' })
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional({ example: 'Lagos, Nigeria' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    type: () => ChurchDto,
    description:
      'Church affiliation. Set `organizationId` if the church exists in the system, ' +
      'or `name` if it does not. Only one should be non-null.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChurchDto)
  church?: ChurchDto;

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
