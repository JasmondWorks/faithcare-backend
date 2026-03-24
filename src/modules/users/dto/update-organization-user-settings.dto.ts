import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationUserSettingsDto } from './create-organization-user-settings.dto';

export class UpdateOrganizationUserSettingsDto extends PartialType(
  CreateOrganizationUserSettingsDto,
) {}
