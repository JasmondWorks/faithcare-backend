import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommunityDto {
  @ApiProperty({ example: 'Young Adults Fellowship' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'A community for young adults aged 18–35 to connect and grow.',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    example: ['64a1f2c3e4b5d6e7f8a9b0c2', '64a1f2c3e4b5d6e7f8a9b0c3'],
    description: 'Array of Member contact IDs to seed the community with',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  members?: string[];

  @ApiPropertyOptional({
    example: 'https://cdn.faithcare.app/communities/yaf.png',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
