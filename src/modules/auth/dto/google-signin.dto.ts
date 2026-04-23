import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleSignInDto {
  @ApiProperty({ enum: ['google'], example: 'google' })
  @IsString()
  @IsIn(['google'])
  provider: 'google';

  @ApiProperty({
    description:
      'Google ID token obtained from the Google Identity Services SDK on the frontend',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  idToken: string;
}
