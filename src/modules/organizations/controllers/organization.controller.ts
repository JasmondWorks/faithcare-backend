import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
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
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Create a new organization — caller becomes the OWNER (ADMIN/SUPER_ADMIN only)',
    description:
      'Creates the organization and generates a first-timer QR code. ' +
      'Sets `organizationId`, `isOrgCreator: true`, and `isOnboarded: true` on the authenticated admin.',
  })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: RequestUser) {
    return this.organizationService.createWithOwner(dto, user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Search organizations (ADMIN/SUPER_ADMIN/USER)',
    description:
      'If `slug` query param is provided, performs a partial (regex) match. Returns an array of up to 20 matching organizations.',
  })
  @ApiResponse({ status: 200, description: 'Array of matching organizations' })
  findAll(@Query('slug') slug?: string) {
    if (slug) {
      return this.organizationService.findBySlug(slug);
    }
    return []; // Or return all if preferred: this.organizationService.findAll();
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
    summary: 'Regenerate the first-timer QR code (ADMIN/SUPER_ADMIN only)',
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

  @Get('mine')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Get the organization associated with the authenticated admin',
    description:
      "Returns full org details using the `organizationId` embedded in the admin's JWT. " +
      'No path parameter needed. Returns `null` if the admin has no organization yet.',
  })
  @ApiResponse({ status: 200, description: 'Organization record (or null)' })
  getMyOrg(@CurrentUser() user: RequestUser) {
    if (!user.organizationId) return null;
    return this.organizationService.getMyOrganization(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details by ID' })
  findOne(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }
}
