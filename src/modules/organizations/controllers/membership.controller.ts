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

@ApiTags('Organization — Members')
@ApiBearerAuth('access-token')
@Controller('organizations/:organizationId/members')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  @ApiOperation({ summary: 'List all active members of an organization' })
  getMembers(@Param('organizationId') organizationId: string) {
    return this.membershipService.getOrganizationMembers(organizationId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite an existing user to the organization by email' })
  invite(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: any,
    @Body() dto: InviteMemberDto,
  ) {
    return this.membershipService.inviteMember(organizationId, user.id, dto);
  }

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Update a member role (ADMIN+ only; only OWNER can assign OWNER)' })
  updateRole(
    @Param('organizationId') organizationId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membershipService.updateMemberRole(organizationId, user.id, targetUserId, dto);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the organization (ADMIN+ only)' })
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.membershipService.removeMember(organizationId, user.id, targetUserId);
  }

  @Delete('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave the organization (OWNER must transfer ownership first)' })
  leave(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.membershipService.leaveOrganization(user.id, organizationId);
  }
}
