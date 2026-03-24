import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from 'src/core/enums/membership-role.enum';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: MembershipRole, example: MembershipRole.ADMIN })
  @IsEnum(MembershipRole)
  role: MembershipRole;
}
