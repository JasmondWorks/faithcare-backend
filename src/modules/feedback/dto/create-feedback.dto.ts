import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
    description: 'ID of the linked first-timer record',
  })
  @IsOptional()
  @IsString()
  firstTimerId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  visitorName: string;

  @ApiProperty({
    example: 'Hi John! We are glad you visited us. How was your experience?',
  })
  @IsString()
  sentMessage: string;

  @ApiProperty({
    example: 'It was great! I felt welcomed. Looking forward to coming back.',
  })
  @IsString()
  receivedMessage: string;

  @ApiProperty({
    enum: ['whatsapp', 'sms', 'email', 'in_person'],
    example: 'whatsapp',
  })
  @IsEnum(['whatsapp', 'sms', 'email', 'in_person'])
  channel: string;
}
