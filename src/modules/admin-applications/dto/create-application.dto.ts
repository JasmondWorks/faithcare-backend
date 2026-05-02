import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID of the organization to apply to',
  })
  @IsMongoId()
  organizationId: string;
}

export class ReviewApplicationDto {
  @ApiPropertyOptional({ example: 'Applicant does not meet requirements' })
  @IsOptional()
  @IsString()
  reason?: string;
}
