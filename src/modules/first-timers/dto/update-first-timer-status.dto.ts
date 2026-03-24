import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFirstTimerStatusDto {
  @ApiProperty({ enum: ['PENDING', 'CONTACTED', 'FOLLOWED_UP'] })
  @IsEnum(['PENDING', 'CONTACTED', 'FOLLOWED_UP'])
  status: 'PENDING' | 'CONTACTED' | 'FOLLOWED_UP';

  @ApiPropertyOptional({ example: 'Called on 9 July. Very receptive.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
