import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrganizationUserSettingsService } from '../services/organization-user-settings.service';
import { CreateOrganizationUserSettingsDto } from '../dto/create-organization-user-settings.dto';
import { UpdateOrganizationUserSettingsDto } from '../dto/update-organization-user-settings.dto';

@Controller('users/organization-settings')
export class OrganizationUserSettingsController {
  constructor(
    private readonly orgUserSettingsService: OrganizationUserSettingsService,
  ) {}

  @Post()
  create(@Body() createDto: CreateOrganizationUserSettingsDto) {
    return this.orgUserSettingsService.create(createDto);
  }

  @Get('user/:userId/organization/:organizationId')
  findByUserAndOrg(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ) {
    return this.orgUserSettingsService.findByUserAndOrg(userId, organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orgUserSettingsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateOrganizationUserSettingsDto) {
    return this.orgUserSettingsService.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.orgUserSettingsService.delete(id);
  }
}
