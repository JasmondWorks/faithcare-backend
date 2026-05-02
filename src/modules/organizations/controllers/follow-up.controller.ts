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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FollowUpService } from '../services/follow-up.service';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { UpdateFollowUpDto } from '../dto/update-follow-up.dto';
import { SendFollowUpMessageDto } from '../dto/send-follow-up-message.dto';
import { LogFollowUpReplyDto } from '../dto/log-follow-up-reply.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('ChurchCare — Follow-Up')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('organizations/:organizationId/follow-ups')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a follow-up task (ADMIN only)',
    description:
      'Creates a follow-up task for any contact: a first-timer, a regular member, or an ad-hoc contact. ' +
      'Set `targetType` to `first_timer` or `member` and supply the matching `targetId`, or omit both ' +
      'for a standalone follow-up. `contactName` and `contactPhone` are always required.',
  })
  @ApiResponse({ status: 201, description: 'Follow-up created' })
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateFollowUpDto,
  ) {
    return this.followUpService.create({ ...dto, organizationId });
  }

  @Get()
  @ApiOperation({
    summary: 'List all follow-up tasks for the organization (ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'List of follow-up tasks' })
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.followUpService.findByOrganization(organizationId);
  }

  @Get('member/:newMemberId')
  @ApiOperation({
    summary: 'List all follow-up tasks for a contact (ADMIN only)',
    description:
      'Returns all follow-up tasks whose `targetId` matches the given ID. ' +
      'Works for first-timer, second-timer, and member targets.',
  })
  @ApiResponse({ status: 200, description: 'List of matching follow-up tasks' })
  findByTarget(@Param('newMemberId') targetId: string) {
    return this.followUpService.findByTarget(targetId);
  }

  @Get('member/:newMemberId/messages')
  @ApiOperation({
    summary: 'Get the message conversation thread for a contact (ADMIN only)',
    description:
      'Returns a chronological list of every sent and received message across all follow-up ' +
      'records for this contact. Each entry includes `sentMessage`, `receivedMessage`, ' +
      '`contactName`, `isFirstTimer`, `isSecondTimer`, `channel`, `deliveryStatus`, and timestamps. ' +
      'Only follow-ups that have at least one message are included.',
  })
  @ApiResponse({ status: 200, description: 'Message thread for the contact' })
  getConversation(@Param('newMemberId') targetId: string) {
    return this.followUpService.getConversation(targetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a follow-up task by ID (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Follow-up task' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.followUpService.findById(id);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Send a WhatsApp or SMS message for this follow-up task (ADMIN only)',
    description:
      'Sends the message via the chosen channel and stores `sentMessage` + `deliveryStatus` on the ' +
      'follow-up record. Status transitions to `CONTACTED`. ' +
      'If the target is a first-timer, the first-timer status is also updated to `CONTACTED`. ' +
      'Returns the updated record plus `delivered: true/false`.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent — follow-up status updated to CONTACTED',
  })
  @ApiResponse({ status: 404, description: 'Follow-up not found' })
  sendMessage(@Param('id') id: string, @Body() dto: SendFollowUpMessageDto) {
    return this.followUpService.sendMessage(id, dto);
  }

  @Patch(':id/reply')
  @ApiOperation({
    summary: "Log the visitor's inbound reply on this follow-up (ADMIN only)",
    description:
      'Stores the visitor\'s reply in `receivedMessage` and transitions status to `REPLIED`. ' +
      'If the target is a first-timer, the first-timer status is also updated to `FOLLOWED_UP`.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reply logged — status updated to REPLIED',
  })
  @ApiResponse({ status: 404, description: 'Follow-up not found' })
  logReply(@Param('id') id: string, @Body() dto: LogFollowUpReplyDto) {
    return this.followUpService.logReply(id, dto.receivedMessage);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a follow-up task (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Updated follow-up task' })
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto) {
    return this.followUpService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a follow-up task (ADMIN only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  delete(@Param('id') id: string) {
    return this.followUpService.delete(id);
  }
}
