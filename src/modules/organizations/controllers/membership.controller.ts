import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipService } from '../services/membership.service';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { RequestUser } from 'src/core/types/request-user.interface';

@ApiTags('Organization — Members')
@ApiBearerAuth('access-token')
@Controller('organizations/:organizationId/members')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  // ── All authenticated users ─────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all active members of an organization' })
  getMembers(@Param('organizationId') organizationId: string) {
    return this.membershipService.getOrganizationMembers(organizationId);
  }

  // ── ADMIN / SUPER_ADMIN only ────────────────────────────────────

  @Post('invite')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Invite an existing user to the organization by email (ADMIN/SUPER_ADMIN only)',
  })
  invite(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.membershipService.inviteMember(organizationId, user.id, dto);
  }

  @Patch(':userId/role')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Update a member role (ADMIN/SUPER_ADMIN only; only OWNER can assign OWNER)',
  })
  updateRole(
    @Param('organizationId') organizationId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membershipService.updateMemberRole(
      organizationId,
      user.id,
      targetUserId,
      dto,
    );
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Remove a member from the organization (ADMIN/SUPER_ADMIN only)',
  })
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.membershipService.removeMember(
      organizationId,
      user.id,
      targetUserId,
    );
  }

  @Delete('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Leave the organization (ADMIN/SUPER_ADMIN only; OWNER must transfer ownership first)',
  })
  leave(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.membershipService.leaveOrganization(user.id, organizationId);
  }
}
