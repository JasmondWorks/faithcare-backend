import { IsBoolean, IsEnum, IsMongoId, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationSettingsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  newFirstTimers: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  newPrayerRequests: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  pendingFollowUpReminders: boolean;
}

export class CreateOrganizationUserSettingsDto {
  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c1' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c2' })
  @IsMongoId()
  organizationId: string;

  @ApiPropertyOptional({ type: () => NotificationSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @ApiPropertyOptional({ enum: ['LIGHT', 'DARK'], example: 'DARK' })
  @IsOptional()
  @IsEnum(['LIGHT', 'DARK'])
  theme?: 'LIGHT' | 'DARK';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is2FAEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['EN', 'FR'], example: 'EN' })
  @IsOptional()
  @IsEnum(['EN', 'FR'])
  language?: 'EN' | 'FR';

  @ApiPropertyOptional({ enum: ['WAT', 'ET'], example: 'WAT' })
  @IsOptional()
  @IsEnum(['WAT', 'ET'])
  timeZone?: 'WAT' | 'ET';
}
