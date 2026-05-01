import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { MessageTemplateService } from '../services/message-template.service';
import { CreateMessageTemplateDto } from '../dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from '../dto/update-message-template.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { Public } from 'src/core/decorators/public.decorator';

@ApiTags('Message Templates')
@Controller('templates')
export class MessageTemplateController {
  constructor(private readonly templateService: MessageTemplateService) {}

  @Get('presets')
  @Public()
  @ApiOperation({ summary: 'List all system-provided preset templates' })
  getPresets() {
    return this.templateService.getPresets();
  }

  @Get()
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      "List an organization's custom templates plus all presets (ADMIN only)",
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  getForOrg(@Query('organizationId') organizationId: string) {
    return this.templateService.getTemplatesForOrg(organizationId);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Create a custom message template for an organization (ADMIN only)',
  })
  create(@Body() dto: CreateMessageTemplateDto) {
    return this.templateService.createOrgTemplate(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Update a custom template — system presets cannot be edited (ADMIN only)',
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  update(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.templateService.updateOrgTemplate(organizationId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Delete a custom template — system presets cannot be deleted (ADMIN only)',
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  delete(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.templateService.deleteOrgTemplate(organizationId, id);
  }
}
