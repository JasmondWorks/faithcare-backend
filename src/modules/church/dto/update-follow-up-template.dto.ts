import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFollowUpTemplateDto {
  @ApiPropertyOptional({
    example: 'Hi {{full_name}}, it was such a joy having you!',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  delayDays?: number;
}
