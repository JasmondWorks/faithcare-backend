import { PartialType } from '@nestjs/swagger';
import { CreateDailyScriptureDto } from './create-daily-scripture.dto';

export class UpdateDailyScriptureDto extends PartialType(CreateDailyScriptureDto) {}
