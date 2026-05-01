import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendFollowUpMessageDto {
  @ApiPropertyOptional({
    example: '+2348012345678',
    description:
      'Override phone number. If omitted, uses the phone stored on the follow-up record.',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  /** Alias kept for backwards compatibility with the field name on the record. */
  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ enum: ['whatsapp', 'sms'], example: 'whatsapp' })
  @IsEnum(['whatsapp', 'sms'])
  channel: 'whatsapp' | 'sms';

  @ApiProperty({
    example: 'Hi John! It was great having you at church on Sunday 🙏',
  })
  @IsString()
  message: string;
}
