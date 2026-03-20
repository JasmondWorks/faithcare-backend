import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipRole } from 'src/core/enums/membership-role.enum';

export class InviteMemberDto {
  @ApiProperty({ example: 'david@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: MembershipRole, example: MembershipRole.MEMBER })
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;
}
