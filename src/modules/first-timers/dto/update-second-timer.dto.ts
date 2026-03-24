import { PartialType } from '@nestjs/swagger';
import { CreateSecondTimerDto } from './create-second-timer.dto';

export class UpdateSecondTimerDto extends PartialType(CreateSecondTimerDto) {}
