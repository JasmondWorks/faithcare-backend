import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'cmVmcmVzaFRva2Vu...' })
  @IsString()
  refreshToken: string;
}
