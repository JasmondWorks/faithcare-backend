import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Denomination } from 'src/core/enums/denomination.enum';
import { MemberCountRange } from 'src/core/enums/member-count-range.enum';

export class CreateOrganizationDto {
  @ApiProperty({ example: '64a1f2c3e4b5d6e7f8a9b0c1' })
  @IsMongoId()
  createdBy: string;

  @ApiProperty({ example: 'Prime Church Lagos' })
  @IsString()
  name: string;

  @ApiProperty({ enum: Denomination, example: Denomination.PENTECOSTAL })
  @IsEnum(Denomination)
  denomination: Denomination;

  @ApiProperty({ example: '12 Admiralty Way' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Lagos State' })
  @IsString()
  state: string;

  @ApiProperty({ example: '100001' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: '+2349012345678' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'https://primechurch.org' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiProperty({ enum: MemberCountRange, example: MemberCountRange.RANGE_101_250 })
  @IsEnum(MemberCountRange)
  memberCountRange: MemberCountRange;
}
