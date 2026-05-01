import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Send a WhatsApp or SMS message to a visitor and automatically log it as feedback. */
export class SendMessageDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
    description: 'Link to a first-timer record',
  })
  @IsOptional()
  @IsString()
  firstTimerId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  visitorName: string;

  @ApiProperty({
    example: '+2348012345678',
    description: 'Recipient phone number with country code',
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ enum: ['whatsapp', 'sms'], example: 'whatsapp' })
  @IsEnum(['whatsapp', 'sms'])
  channel: 'whatsapp' | 'sms';

  @ApiProperty({
    example: 'Hi John! It was great having you at church on Sunday 🙏',
  })
  @IsString()
  message: string;
}
