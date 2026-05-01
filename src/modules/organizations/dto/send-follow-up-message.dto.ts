import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendFollowUpMessageDto {
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
