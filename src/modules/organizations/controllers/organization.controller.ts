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
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
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
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Create a new organization — caller becomes the OWNER (ADMIN/SUPER_ADMIN only)',
    description:
      'Creates the organization and generates a first-timer QR code. ' +
      'Sets `organizationId`, `isOrgCreator: true`, and `isOnboarded: true` on the authenticated admin.',
  })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.organizationService.createWithOwner(dto, user.id);
    return { success: true, data };
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Search organizations by slug',
    description:
      'Performs a partial (regex) match against the slug field. Returns an array of up to 20 matching organizations. Used by admins and users searching for a church.',
  })
  @ApiQuery({
    name: 'slug',
    required: false,
    type: String,
    description: 'Partial or full slug to search for, e.g. "prime-church"',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of matching organizations (empty if no slug provided)',
  })
  async findAll(@Query('slug') slug?: string) {
    let data: any[] = [];
    if (slug) {
      data = await this.organizationService.findBySlug(slug);
    }
    return { success: true, data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update organization details (ADMIN/SUPER_ADMIN only)',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    const data = await this.organizationService.update(id, dto);
    return { success: true, data };
  }

  @Post(':id/qr-code/regenerate')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Regenerate the first-timer QR code (ADMIN/SUPER_ADMIN only)',
  })
  async regenerateQrCode(@Param('id') id: string) {
    const data = await this.organizationService.regenerateQrCode(id);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Soft-delete an organization (ADMIN/SUPER_ADMIN only)',
  })
  async delete(@Param('id') id: string) {
    await this.organizationService.softDelete(id);
    return { success: true };
  }

  @Get('mine')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get the organization associated with the authenticated admin',
    description:
      "Returns full org details using the `organizationId` embedded in the admin's JWT. " +
      'No path parameter needed. Returns `null` if the admin has no organization yet.',
  })
  @ApiResponse({ status: 200, description: 'Organization record (or null)' })
  async getMyOrg(@CurrentUser() user: RequestUser) {
    const org = await this.organizationService.getMyOrganization(
      user.organizationId,
      user.id,
    );
    return { success: true, data: org };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.organizationService.findById(id);
    return { success: true, data };
  }
}
