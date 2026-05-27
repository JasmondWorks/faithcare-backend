import { IsMongoId, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AddVerseDto {
  @ApiPropertyOptional({ description: 'ID of an existing Verse document' })
  @IsOptional()
  @IsMongoId()
  verseId?: string;

  @ApiPropertyOptional({
    description: 'Human-readable reference, e.g. "John 3:16". Required when verseId is absent.',
  })
  @ValidateIf((o: AddVerseDto) => !o.verseId)
  @IsString()
  reference?: string;

  @ApiPropertyOptional({
    enum: ['KJV', 'ASV', 'WEB'],
    default: 'KJV',
  })
  @IsOptional()
  @IsString()
  translation?: string;
}
