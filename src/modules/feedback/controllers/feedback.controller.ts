import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FeedbackService } from '../services/feedback.service';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('ChurchCare — Feedback')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({
    summary: 'Log a feedback record from a visitor conversation (ADMIN only)',
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
