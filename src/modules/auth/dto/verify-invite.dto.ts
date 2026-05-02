import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyInviteDto {
  @ApiProperty({
    description: 'Invite token extracted from the invitation link',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token: string;
}
