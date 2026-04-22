import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
import { MembershipService } from '../services/membership.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { RequestUser } from 'src/core/types/request-user.interface';

@ApiTags('Organization')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly membershipService: MembershipService,
  ) {}

  // ── ADMIN / SUPER_ADMIN only ────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Create a new organization — caller becomes the OWNER (ADMIN/SUPER_ADMIN only)',
  })
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: RequestUser) {
    return this.organizationService.createWithOwner(dto, user.id);
  }

  @Get('slug/:slug')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Find an organization by its URL slug (ADMIN/SUPER_ADMIN only)',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.organizationService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update organization details (ADMIN/SUPER_ADMIN only)',
  })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationService.update(id, dto);
  }

  @Post(':id/qr-code/regenerate')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Regenerate the first-timer QR code for an organization (ADMIN/SUPER_ADMIN only)',
  })
  regenerateQrCode(@Param('id') id: string) {
    return this.organizationService.regenerateQrCode(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Soft-delete an organization (ADMIN/SUPER_ADMIN only)',
  })
  delete(@Param('id') id: string) {
    return this.organizationService.softDelete(id);
  }

  // ── All authenticated users ─────────────────────────────────────

  @Get('mine')
  @ApiOperation({
    summary: 'List all organizations the authenticated user belongs to',
  })
  mine(@CurrentUser() user: RequestUser) {
    return this.membershipService.getUserOrganizations(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details by ID' })
  findOne(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }
}
