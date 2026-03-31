import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    example: 'cmVmcmVzaFRva2Vu...',
    description: 'Omit when using the HttpOnly cookie (pure browser clients).',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
