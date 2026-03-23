import { IsMongoId, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConnectChurchDto {
  @ApiPropertyOptional({
    example: '64a1f2c3e4b5d6e7f8a9b0c1',
    description:
      'ID of an existing organization in the system. ' +
      'Provide this when the user selects a church from search results.',
  })
  @ValidateIf((o) => !o.name)
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiPropertyOptional({
    example: 'Grace Chapel Lagos',
    description:
      'Free-text church name. ' +
      'Provide this when the church is not found in the system.',
  })
  @ValidateIf((o) => !o.organizationId)
  @IsOptional()
  @IsString()
  name?: string;
}
