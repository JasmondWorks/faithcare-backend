import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationUserSettingsService } from '../services/organization-user-settings.service';
import { CreateOrganizationUserSettingsDto } from '../dto/create-organization-user-settings.dto';
import { UpdateOrganizationUserSettingsDto } from '../dto/update-organization-user-settings.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('Users — Organization Settings')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('users/organization-settings')
export class OrganizationUserSettingsController {
  constructor(
    private readonly orgUserSettingsService: OrganizationUserSettingsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create org-user settings record (ADMIN/SUPER_ADMIN only)',
  })
  create(@Body() createDto: CreateOrganizationUserSettingsDto) {
    return this.orgUserSettingsService.create(createDto);
  }

  @Get('user/:userId/organization/:organizationId')
  @ApiOperation({
    summary:
      'Get settings for a user in a specific org (ADMIN/SUPER_ADMIN only)',
  })
  findByUserAndOrg(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ) {
    return this.orgUserSettingsService.findByUserAndOrg(userId, organizationId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get settings by record ID (ADMIN/SUPER_ADMIN only)',
  })
  findOne(@Param('id') id: string) {
    return this.orgUserSettingsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update org-user settings (ADMIN/SUPER_ADMIN only)',
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationUserSettingsDto,
  ) {
    return this.orgUserSettingsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete org-user settings (ADMIN/SUPER_ADMIN only)',
  })
  delete(@Param('id') id: string) {
    return this.orgUserSettingsService.delete(id);
  }
}
