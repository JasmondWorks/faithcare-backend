import { PartialType } from '@nestjs/swagger';
import { CreateFocusTimerDto } from './create-focus-timer.dto';

export class UpdateFocusTimerDto extends PartialType(CreateFocusTimerDto) {}
