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
    summary: 'Create a follow-up task for a first-timer (ADMIN only)',
  })
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
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.followUpService.findByOrganization(organizationId);
  }

  @Get('member/:newMemberId')
  @ApiOperation({
    summary: 'List follow-ups for a specific first-timer (ADMIN only)',
  })
  findByTarget(@Param('newMemberId') targetId: string) {
    return this.followUpService.findByTarget(targetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a follow-up task by ID (ADMIN only)' })
  findOne(@Param('id') id: string) {
    return this.followUpService.findById(id);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Send a WhatsApp or SMS message for this follow-up task (ADMIN only)',
    description:
      'Sends the message via the chosen channel and stores sentMessage + deliveryStatus on the ' +
      'follow-up record. Returns the updated record plus `delivered: true/false`.',
  })
  sendMessage(@Param('id') id: string, @Body() dto: SendFollowUpMessageDto) {
    return this.followUpService.sendMessage(id, dto);
  }

  @Patch(':id/reply')
  @ApiOperation({
    summary: "Log the visitor's inbound reply on this follow-up (ADMIN only)",
    description:
      'Updates `receivedMessage` on the follow-up record when the visitor responds.',
  })
  logReply(@Param('id') id: string, @Body() dto: LogFollowUpReplyDto) {
    return this.followUpService.logReply(id, dto.receivedMessage);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a follow-up task (ADMIN only)' })
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto) {
    return this.followUpService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a follow-up task (ADMIN only)' })
  delete(@Param('id') id: string) {
    return this.followUpService.delete(id);
  }
}
