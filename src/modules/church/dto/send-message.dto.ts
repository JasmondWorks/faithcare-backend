import { IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c1' })
  @IsMongoId()
  firstTimerId: string;

  @ApiProperty({ example: 'tpl_welcome_whatsapp' })
  @IsMongoId()
  templateId: string;

  @ApiProperty({ enum: ['whatsapp', 'email', 'sms'], example: 'whatsapp' })
  @IsEnum(['whatsapp', 'email', 'sms'])
  channel: string;
}
