import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Manually log a conversation that already happened (e.g. in-person chat). */
export class CreateFeedbackDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({ example: '64f1a2b3c4d5e6f7a8b9c0d2' })
  @IsOptional()
  @IsString()
  firstTimerId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  visitorName: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    enum: ['whatsapp', 'sms', 'email', 'in_person'],
    example: 'in_person',
  })
  @IsEnum(['whatsapp', 'sms', 'email', 'in_person'])
  channel: string;

  @ApiPropertyOptional({ example: 'Hi John! We are glad you visited us.' })
  @IsOptional()
  @IsString()
  sentMessage?: string;

  @ApiPropertyOptional({
    example: 'It was great! Looking forward to coming back.',
  })
  @IsOptional()
  @IsString()
  receivedMessage?: string;
}
