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
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommunityService } from '../services/community.service';
import { CreateCommunityDto } from '../dto/create-community.dto';
import { UpdateCommunityDto } from '../dto/update-community.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { RequestUser } from 'src/core/types/request-user.interface';

class UpdateCommunityMembersDto {
  @ApiProperty({ description: 'User ID to add or remove' })
  @IsString()
  userId: string;
}

@ApiTags('Organization — Communities')
@ApiBearerAuth('access-token')
@Controller('organizations/:organizationId/communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // ── USER accessible ─────────────────────────────────────────────

  @Get('user')
  @ApiOperation({
    summary:
      'List communities the authenticated user belongs to within this org',
  })
  findByUser(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.communityService.findByUserInOrg(user.id, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community details by ID' })
  findOne(@Param('id') id: string) {
    return this.communityService.findById(id);
  }

  // ── ADMIN / SUPER_ADMIN only ────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Create a new community within the organization (ADMIN/SUPER_ADMIN only)',
  })
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateCommunityDto,
  ) {
    return this.communityService.create({ ...createDto, organizationId });
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'List all communities in the organization (ADMIN/SUPER_ADMIN only)',
  })
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.communityService.findByOrganization(organizationId);
  }

  @Get(':id/recent-members')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Get a community with its 5 most recent members (ADMIN/SUPER_ADMIN only)',
  })
  findWithRecentMembers(@Param('id') id: string) {
    return this.communityService.findWithRecentMembers(id);
  }

  @Patch(':id/members/add')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Add a user to a community (ADMIN/SUPER_ADMIN only)',
  })
  addMember(@Param('id') id: string, @Body() dto: UpdateCommunityMembersDto) {
    return this.communityService.addMember(id, dto.userId);
  }

  @Patch(':id/members/remove')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Remove a user from a community (ADMIN/SUPER_ADMIN only)',
  })
  removeMember(
    @Param('id') id: string,
    @Body() dto: UpdateCommunityMembersDto,
  ) {
    return this.communityService.removeMember(id, dto.userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a community (ADMIN/SUPER_ADMIN only)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCommunityDto) {
    return this.communityService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a community (ADMIN/SUPER_ADMIN only)' })
  delete(@Param('id') id: string) {
    return this.communityService.delete(id);
  }
}
