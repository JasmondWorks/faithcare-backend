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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiResponse } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsString } from 'class-validator';
import { CommunityService } from '../services/community.service';
import { CreateCommunityDto } from '../dto/create-community.dto';
import { UpdateCommunityDto } from '../dto/update-community.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { RequestUser } from 'src/core/types/request-user.interface';

class UpdateCommunityMembersDto {
  @ApiProperty({ description: 'ID of the Member contact to add or remove' })
  @IsMongoId()
  memberId: string;
}

class BroadcastMessageDto {
  @ApiProperty({
    enum: ['whatsapp', 'sms'],
    example: 'whatsapp',
    description: 'Channel to send the message through',
  })
  @IsEnum(['whatsapp', 'sms'])
  channel: 'whatsapp' | 'sms';

  @ApiProperty({
    example: 'Hi {{name}}, service starts at 9am this Sunday. See you there!',
    description: 'Message text to send to every member in the community',
  })
  @IsString()
  message: string;
}

@ApiTags('Organization — Communities')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('church/communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new community (ADMIN/SUPER_ADMIN only)',
    description:
      'Creates a contact group within the organization. Optionally seed it with Member IDs in `members`.',
  })
  @ApiResponse({ status: 201, description: 'Community created' })
  create(
    @CurrentUser() user: RequestUser,
    @Body() createDto: CreateCommunityDto,
  ) {
    return this.communityService.create({ ...createDto, organizationId: user.organizationId! });
  }

  @Get()
  @ApiOperation({
    summary: "List all communities in the authenticated admin's org (ADMIN/SUPER_ADMIN only)",
    description: 'Each community is returned with its members populated (name, phoneNumber, email, status).',
  })
  @ApiResponse({ status: 200, description: 'List of communities with populated members' })
  findByOrganization(@CurrentUser() user: RequestUser) {
    return this.communityService.findByOrganization(user.organizationId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community details by ID' })
  @ApiResponse({ status: 200, description: 'Community with populated members' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.communityService.findById(id);
  }

  @Get(':id/recent-members')
  @ApiOperation({
    summary: 'Get a community with its 5 most recent members (ADMIN/SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Community + recentMembers array (up to 5)' })
  findWithRecentMembers(@Param('id') id: string) {
    return this.communityService.findWithRecentMembers(id);
  }

  @Post(':id/broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Broadcast a WhatsApp or SMS message to all community members (ADMIN/SUPER_ADMIN only)',
    description:
      'Sends the `message` text to every member contact in the community via the chosen channel. ' +
      'Returns `{ sent, failed, totalMembers }`. Members without a phone number are silently skipped.',
  })
  @ApiResponse({
    status: 200,
    description: 'Broadcast result',
    schema: {
      example: { success: true, data: { sent: 12, failed: 1, totalMembers: 13 } },
    },
  })
  @ApiResponse({ status: 404, description: 'Community not found' })
  broadcastMessage(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: BroadcastMessageDto,
  ) {
    return this.communityService.broadcastMessage(id, dto.channel, dto.message, user.organizationId!);
  }

  @Patch(':id/members/add')
  @ApiOperation({
    summary: 'Add a Member contact to a community (ADMIN/SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Updated community with populated members' })
  addMember(@Param('id') id: string, @Body() dto: UpdateCommunityMembersDto) {
    return this.communityService.addMember(id, dto.memberId);
  }

  @Patch(':id/members/remove')
  @ApiOperation({
    summary: 'Remove a Member contact from a community (ADMIN/SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Updated community with populated members' })
  removeMember(
    @Param('id') id: string,
    @Body() dto: UpdateCommunityMembersDto,
  ) {
    return this.communityService.removeMember(id, dto.memberId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a community name, description, or image (ADMIN/SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Updated community' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCommunityDto) {
    return this.communityService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a community (ADMIN/SUPER_ADMIN only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  delete(@Param('id') id: string) {
    return this.communityService.delete(id);
  }
}
