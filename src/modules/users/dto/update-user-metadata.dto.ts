import { PartialType } from '@nestjs/swagger';
import { CreateUserMetaDataDto } from './create-user-metadata.dto';

export class UpdateUserMetaDataDto extends PartialType(CreateUserMetaDataDto) {}
