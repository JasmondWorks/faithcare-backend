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
import { FollowUpService } from '../services/follow-up.service';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { UpdateFollowUpDto } from '../dto/update-follow-up.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('Organization — Follow-Ups')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('organizations/:organizationId/follow-ups')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  @ApiOperation({ summary: 'Create a follow-up task (ADMIN/SUPER_ADMIN only)' })
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateFollowUpDto,
  ) {
    return this.followUpService.create({ ...createDto, organizationId });
  }

  @Get()
  @ApiOperation({
    summary:
      'List follow-up tasks for the organization (ADMIN/SUPER_ADMIN only)',
  })
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.followUpService.findByOrganization(organizationId);
  }

  @Get('member/:newMemberId')
  @ApiOperation({
    summary:
      'List follow-ups for a specific first-timer (ADMIN/SUPER_ADMIN only)',
  })
  findByMember(@Param('newMemberId') newMemberId: string) {
    return this.followUpService.findByMember(newMemberId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a follow-up task by ID (ADMIN/SUPER_ADMIN only)',
  })
  findOne(@Param('id') id: string) {
    return this.followUpService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a follow-up task (ADMIN/SUPER_ADMIN only)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateFollowUpDto) {
    return this.followUpService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a follow-up task (ADMIN/SUPER_ADMIN only)' })
  delete(@Param('id') id: string) {
    return this.followUpService.delete(id);
  }
}
