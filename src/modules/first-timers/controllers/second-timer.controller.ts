import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SecondTimerService } from '../services/second-timer.service';
import { CreateSecondTimerDto } from '../dto/create-second-timer.dto';
import { UpdateSecondTimerDto } from '../dto/update-second-timer.dto';

@Controller('organizations/:organizationId/second-timers')
export class SecondTimerController {
  constructor(private readonly secondTimerService: SecondTimerService) {}

  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateSecondTimerDto,
  ) {
    return this.secondTimerService.create({ ...createDto, organizationId });
  }

  @Get()
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.secondTimerService.findByOrganization(organizationId);
  }

  @Get('first-timer/:firstTimerId')
  findByFirstTimer(@Param('firstTimerId') firstTimerId: string) {
    return this.secondTimerService.findByFirstTimer(firstTimerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.secondTimerService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSecondTimerDto) {
    return this.secondTimerService.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.secondTimerService.delete(id);
  }
}
