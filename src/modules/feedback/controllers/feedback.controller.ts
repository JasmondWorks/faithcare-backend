import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FeedbackService } from '../services/feedback.service';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { LogReplyDto } from '../dto/log-reply.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('ChurchCare — Feedback')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Send a WhatsApp or SMS message to a visitor and log it (ADMIN only)',
    description:
      'Sends the message via the chosen channel and creates a feedback record. ' +
      'Returns the record plus `delivered: true/false` indicating whether the ' +
      'message was accepted by the provider.',
  })
  sendMessage(@Body() dto: SendMessageDto) {
    return this.feedbackService.sendMessage(dto);
  }

  @Patch(':id/reply')
  @ApiOperation({
    summary:
      "Log a visitor's inbound reply on an existing feedback thread (ADMIN only)",
    description:
      'Use this when a visitor replies to a message. Updates `receivedMessage` on the record.',
  })
  logReply(@Param('id') id: string, @Body() dto: LogReplyDto) {
    return this.feedbackService.logReply(id, dto.receivedMessage);
  }

  @Post()
  @ApiOperation({
    summary:
      'Manually log a conversation (e.g. in-person) without sending a message (ADMIN only)',
    description:
      'Use this to record a conversation that happened outside the platform — ' +
      'in person, via a personal phone, etc.',
  })
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all feedback records for an organization (ADMIN only)',
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  findByOrg(@Query('organizationId') organizationId: string) {
    return this.feedbackService.findByOrganization(organizationId);
  }

  @Get('first-timer/:firstTimerId')
  @ApiOperation({
    summary:
      'List feedback records linked to a specific first-timer (ADMIN only)',
  })
  findByFirstTimer(@Param('firstTimerId') firstTimerId: string) {
    return this.feedbackService.findByFirstTimer(firstTimerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single feedback record by ID (ADMIN only)' })
  findOne(@Param('id') id: string) {
    return this.feedbackService.findById(id);
  }
}
