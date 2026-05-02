import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationRole } from 'src/core/enums/organization-role.enum';

export class InviteAdminDto {
  @ApiProperty({ example: 'Grace Okafor' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'grace@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: OrganizationRole })
  @IsOptional()
  @IsEnum(OrganizationRole)
  organizationRole?: OrganizationRole;
}
