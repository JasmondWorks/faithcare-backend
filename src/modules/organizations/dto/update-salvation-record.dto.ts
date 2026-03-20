import { PartialType } from '@nestjs/swagger';
import { CreateSalvationRecordDto } from './create-salvation-record.dto';

export class UpdateSalvationRecordDto extends PartialType(CreateSalvationRecordDto) {}
