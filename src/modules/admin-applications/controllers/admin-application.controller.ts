import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
      'Expires in 30 days if not approved — account is auto-deleted on expiry.',
  })
  apply(@Body() dto: CreateApplicationDto, @CurrentUser() user: RequestUser) {
    return this.service.apply(user.id, dto.organizationId);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get the status of your own application' })
  getMyApplication(@CurrentUser() user: RequestUser) {
    return this.service.getMyApplication(user.id);
  }

  @Get('organization/:organizationId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'List pending applications for an organization (org creator or SUPER_ADMIN only)',
  })
  listForOrg(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.listForOrganization(organizationId, user.id, user.role);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Approve an admin application',
    description:
      'Granted immediately if approver is the org creator or SUPER_ADMIN. ' +
      'Otherwise requires 2 approvals from verified admins.',
  })
  approve(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.approve(id, user.id, user.role);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Reject an admin application (org creator or SUPER_ADMIN only)',
  })
  reject(
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.reject(id, user.id, user.role, dto.reason);
  }
}
