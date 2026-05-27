import {
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitReviewDto {
  @ApiProperty({ description: 'Verse document ID' })
  @IsMongoId()
  verseId: string;

  @ApiProperty({ enum: ['perfect', 'hesitant', 'failed'] })
  @IsEnum(['perfect', 'hesitant', 'failed'])
  grade: 'perfect' | 'hesitant' | 'failed';

  @ApiProperty({ minimum: 0, description: 'Seconds spent on this review' })
  @IsInt()
  @Min(0)
  timeSpentSeconds: number;

  @ApiPropertyOptional({
    description:
      'Actual review timestamp for offline sync. Must be within the last 7 days.',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reviewedAt?: Date;
}
