import { IsEnum, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FocusTimerStatus } from 'src/core/enums/focus-timer-status.enum';

export class CreateFocusTimerDto {
  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c1' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: 25, description: 'Session duration in minutes' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ enum: FocusTimerStatus, example: FocusTimerStatus.NOT_STARTED })
  @IsOptional()
  @IsEnum(FocusTimerStatus)
  status?: FocusTimerStatus;

  @ApiPropertyOptional({ example: 0, description: 'Minutes elapsed so far', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentProgress?: number;
}
