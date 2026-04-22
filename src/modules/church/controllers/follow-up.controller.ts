import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FollowUpTemplateService } from '../services/follow-up-template.service';
import { MessageLogService } from '../services/message-log.service';
import { UpdateFollowUpTemplateDto } from '../dto/update-follow-up-template.dto';
import { SendMessageDto } from '../dto/send-message.dto';

@ApiTags('ChurchCare — Follow-Up')
@ApiBearerAuth()
@Controller('church/follow-up')
export class FollowUpController {
  constructor(
    private readonly followUpTemplateService: FollowUpTemplateService,
    private readonly messageLogService: MessageLogService,
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'List all editable follow-up message templates' })
  findTemplates(@Query('organizationId') organizationId: string) {
    return this.followUpTemplateService.findByOrganization(organizationId);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update message template body or delay timing' })
  updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateFollowUpTemplateDto,
  ) {
    return this.followUpTemplateService.update(id, updateDto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'View sent message history with delivery status' })
  findLogs(@Query('organizationId') organizationId: string) {
    return this.messageLogService.findByOrganization(organizationId);
  }

  @Post('send')
  @ApiOperation({
    summary: 'Manually trigger a follow-up message to a specific visitor',
  })
  sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.messageLogService.create({
      ...sendMessageDto,
      status: 'queued',
    });
  }
}
