import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Log an inbound reply from the visitor on an existing feedback thread. */
export class LogReplyDto {
  @ApiProperty({
    example: 'Thanks! I really enjoyed the service. Will come again soon.',
  })
  @IsString()
  receivedMessage: string;
}
