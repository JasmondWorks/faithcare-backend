import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminApplicationService } from '../services/admin-application.service';
import {
  CreateApplicationDto,
  ReviewApplicationDto,
} from '../dto/create-application.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('Admin Applications')
@ApiBearerAuth('access-token')
@Controller('admin-applications')
export class AdminApplicationController {
  constructor(private readonly service: AdminApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit an application to join an organization as admin',
    description:
      'An ADMIN account that is not yet verified submits this to request org-level access. ' +
      'Sets `pendingOrganizationId` on the user. ' +
      'Expires in 30 days if not approved — the account is auto-deleted on expiry.',
  })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  @ApiResponse({ status: 400, description: 'Account already verified' })
  @ApiResponse({ status: 403, description: 'Only ADMIN accounts can apply' })
  @ApiResponse({ status: 404, description: 'User or organization not found' })
  @ApiResponse({ status: 409, description: 'A pending application already exists' })
  async apply(@Body() dto: CreateApplicationDto, @CurrentUser() user: RequestUser) {
    const data = await this.service.apply(user.id, dto.organizationId);
    return { success: true, data };
  }

  @Get('mine')
  @ApiOperation({
    summary: 'Get the status of your own application',
    description: 'Returns the current application record for the authenticated admin, or null if none exists.',
  })
  @ApiResponse({ status: 200, description: 'Application record (or null)' })
  async getMyApplication(@CurrentUser() user: RequestUser) {
    const data = await this.service.getMyApplication(user.id);
    return { success: true, data };
  }

  @Get('organization/:organizationId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List pending applications for an organization (org creator or SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'List of pending applications' })
  @ApiResponse({ status: 403, description: 'Not the org creator or SUPER_ADMIN' })
  async listForOrg(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.service.listForOrganization(organizationId, user.id, user.role);
    return { success: true, data };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Approve an admin application',
    description:
      'Granted immediately if the approver is the org creator or SUPER_ADMIN. ' +
      'Otherwise requires 2 approvals from verified admins in total. ' +
      'On full approval, sets `isAdminVerified: true`, `organizationId`, and `isOnboarded: true` on the applicant.',
  })
  @ApiResponse({
    status: 200,
    description: 'Approval recorded — `approved: true` when fully granted, `approved: false` when awaiting more votes',
  })
  @ApiResponse({ status: 400, description: 'Application is no longer pending' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 409, description: 'You have already approved this application' })
  approve(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.approve(id, user.id, user.role);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Reject an admin application (org creator or SUPER_ADMIN only)',
    description:
      'Clears `pendingOrganizationId` from the applicant. Optionally records a rejection reason.',
  })
  @ApiResponse({ status: 200, description: 'Application rejected' })
  @ApiResponse({ status: 400, description: 'Application is no longer pending' })
  @ApiResponse({ status: 403, description: 'Not the org creator or SUPER_ADMIN' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  reject(
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.reject(id, user.id, user.role, dto.reason);
  }
}
