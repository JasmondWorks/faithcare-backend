import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrayerRequestStatus } from 'src/core/enums/prayer-request-status.enum';

export class CreatePrayerRequestDto {

  @ApiProperty({ example: 'Blessing Okonkwo' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Believing God for complete healing from a prolonged illness.',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    enum: PrayerRequestStatus,
    example: PrayerRequestStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(PrayerRequestStatus)
  status?: PrayerRequestStatus;
}
