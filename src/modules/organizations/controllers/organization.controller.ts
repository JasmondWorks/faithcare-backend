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

@ApiTags('Organization')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly membershipService: MembershipService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization — caller becomes the OWNER' })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationService.createWithOwner(dto, user.id);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List all organizations the authenticated user belongs to' })
  mine(@CurrentUser() user: any) {
    return this.membershipService.getUserOrganizations(user.id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Find an organization by its URL slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.organizationService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details by ID' })
  findOne(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization details (ADMIN+ only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an organization (OWNER only)' })
  delete(@Param('id') id: string) {
    return this.organizationService.softDelete(id);
  }
}
