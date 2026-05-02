import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJournalEntryDto {
  @ApiProperty({ example: 'Walking by Faith, Not by Sight' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '2 Corinthians 5:7' })
  @IsOptional()
  @IsString()
  scriptureReference?: string;

  @ApiProperty({
    example:
      "Today's sermon reminded me to trust God's plan even when I can't see the full picture. I was challenged to let go of anxiety about my career and lean into His promises.",
  })
  @IsString()
  content: string;
}
