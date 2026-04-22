import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConnectChurchDto {
  @ApiPropertyOptional({
    example: '64a1f2c3e4b5d6e7f8a9b0c1',
    description:
      'ID of an existing organization. Provide when the user selects a church from search results.',
  })
  @IsOptional()
  @IsMongoId()
  organization?: string;

  @ApiPropertyOptional({
    example: 'Grace Chapel Lagos',
    description:
      'Free-text church name. Provide when the church is not found in the system.',
  })
  @IsOptional()
  @IsString()
  churchName?: string;
}
