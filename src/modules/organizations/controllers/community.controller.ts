import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommunityService } from '../services/community.service';
import { CreateCommunityDto } from '../dto/create-community.dto';
import { UpdateCommunityDto } from '../dto/update-community.dto';

@Controller('organizations/:organizationId/communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateCommunityDto,
  ) {
    return this.communityService.create({ ...createDto, organizationId });
  }

  @Get()
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.communityService.findByOrganization(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communityService.findById(id);
  }

  @Get(':id/recent-members')
  findWithRecentMembers(@Param('id') id: string) {
    return this.communityService.findWithRecentMembers(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateCommunityDto) {
    return this.communityService.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.communityService.delete(id);
  }
}
