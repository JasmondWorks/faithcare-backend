import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MessageTemplateService } from '../services/message-template.service';
import { CreateMessageTemplateDto } from '../dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from '../dto/update-message-template.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { Public } from 'src/core/decorators/public.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';

@ApiTags('Message Templates')
@Controller('templates')
export class MessageTemplateController {
  constructor(private readonly templateService: MessageTemplateService) {}

  @Get('presets')
  @Public()
  @ApiOperation({
    summary: 'List all system preset templates',
    description: 'Read-only reference templates provided by the platform. Use these as a starting point when creating org-specific templates.',
  })
  @ApiResponse({ status: 200, description: 'List of system preset templates' })
  getPresets() {
    return this.templateService.getPresets();
  }

  @Get()
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "List the authenticated org's custom templates plus all presets (ADMIN only)",
    description: 'Returns both the org\'s own custom templates and the global system presets in a single list.',
  })
  @ApiResponse({ status: 200, description: 'Combined list of org templates and presets' })
  getForOrg(@CurrentUser() user: RequestUser) {
    return this.templateService.getTemplatesForOrg(user.organizationId!);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a custom message template for the org (ADMIN only)',
    description: 'Creates a fully editable template scoped to the authenticated admin\'s organization.',
  })
  @ApiResponse({ status: 201, description: 'Template created' })
  create(
    @Body() dto: CreateMessageTemplateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.templateService.createOrgTemplate(dto, user.organizationId!);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update a custom org template (ADMIN only)',
    description: 'Updates the template. Only templates belonging to the authenticated admin\'s organization can be edited. System presets cannot be modified.',
  })
  @ApiResponse({ status: 200, description: 'Updated template' })
  @ApiResponse({ status: 403, description: 'System presets cannot be edited' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMessageTemplateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.templateService.updateOrgTemplate(user.organizationId!, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a custom org template (ADMIN only)',
    description: 'Soft-deletes the template. Only templates belonging to the authenticated admin\'s organization can be deleted. System presets cannot be deleted.',
  })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'System presets cannot be deleted' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  delete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.templateService.deleteOrgTemplate(user.organizationId!, id);
  }
}
