import { IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Denomination } from 'src/core/enums/denomination.enum';
import { MemberCountRange } from 'src/core/enums/member-count-range.enum';
import { OrganizationRole } from 'src/core/enums/organization-role.enum';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Prime Church Lagos' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'prime-church-lagos',
    description: 'URL-safe unique handle (auto-generated from name if omitted)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers and hyphens only' })
  slug?: string;

  @ApiProperty({ example: 'primechurchofficial@example.com' })
  @IsEmail()
  email: string;

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

  @ApiProperty({ enum: OrganizationRole, example: OrganizationRole.SENIOR_PASTOR, description: "The creator's role/title within the church" })
  @IsEnum(OrganizationRole)
  organizationRole: OrganizationRole;
}
