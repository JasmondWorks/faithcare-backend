import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogFollowUpReplyDto {
  @ApiProperty({
    example: 'Thanks! I really enjoyed the service. Will come again soon.',
  })
  @IsString()
  receivedMessage: string;
}
