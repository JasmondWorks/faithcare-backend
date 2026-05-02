import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { MessageTemplateDocument } from '../schemas/message-template.schema';
import { MessageTemplateRepository } from '../repositories/message-template.repository';
import { CreateMessageTemplateDto } from '../dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from '../dto/update-message-template.dto';
import { TEMPLATE_PRESETS } from '../presets/template-presets';

@Injectable()
export class MessageTemplateService
  extends BaseService<MessageTemplateDocument>
  implements OnModuleInit
{
  constructor(private readonly templateRepository: MessageTemplateRepository) {
    super(templateRepository);
  }

  async onModuleInit() {
    await this.seedPresets();
  }

  async seedPresets() {
    for (const preset of TEMPLATE_PRESETS) {
      await this.templateRepository.upsertPreset(preset);
    }
  }

  getTemplatesForOrg(organizationId: string) {
    return this.templateRepository.findByOrganization(organizationId);
  }

  getPresets() {
    return this.templateRepository.findPresets();
  }

  createOrgTemplate(dto: CreateMessageTemplateDto, organizationId: string) {
    return this.templateRepository.create({ ...dto, organizationId });
  }

  async updateOrgTemplate(
    organizationId: string,
    id: string,
    dto: UpdateMessageTemplateDto,
  ) {
    const template = await this.templateRepository.findByOrgAndId(
      organizationId,
      id,
    );
    if (!template) throw new NotFoundException('Template not found');
    if ((template as any).isPreset)
      throw new ForbiddenException('System presets cannot be edited');
    return this.templateRepository.update(id, dto);
  }

  async deleteOrgTemplate(organizationId: string, id: string) {
    const template = await this.templateRepository.findByOrgAndId(
      organizationId,
      id,
    );
    if (!template) throw new NotFoundException('Template not found');
    if ((template as any).isPreset)
      throw new ForbiddenException('System presets cannot be deleted');
    return this.templateRepository.softDelete(id);
  }

  async getTemplateById(id: string) {
    const template = await this.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  resolveVariables(body: string, vars: Record<string, string>): string {
    return body.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => vars[key] ?? `{{${key}}}`,
    );
  }

}
