import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FocusTimerService } from '../services/focus-timer.service';
import { CreateFocusTimerDto } from '../dto/create-focus-timer.dto';
import { UpdateFocusTimerDto } from '../dto/update-focus-timer.dto';
import { FocusTimerStatus } from 'src/core/enums/focus-timer-status.enum';

@ApiTags('Focus Timer')
@ApiBearerAuth()
@Controller('timer/sessions')
export class FocusTimerController {
  constructor(private readonly focusTimerService: FocusTimerService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new focus session' })
  create(@Body() createFocusTimerDto: CreateFocusTimerDto) {
    return this.focusTimerService.create(createFocusTimerDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all focus sessions with summary stats' })
  findByUser(@Query('userId') userId: string) {
    return this.focusTimerService.findByUser(userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the currently active focus session' })
  findActive(@Query('userId') userId: string) {
    return this.focusTimerService.findActiveByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific focus session by ID' })
  findOne(@Param('id') id: string) {
    return this.focusTimerService.findById(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a session — returns scripture reward' })
  complete(@Param('id') id: string) {
    return this.focusTimerService.update(id, { status: FocusTimerStatus.COMPLETED });
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause a running focus session' })
  pause(@Param('id') id: string, @Body() body: { currentProgress: number }) {
    return this.focusTimerService.update(id, {
      status: FocusTimerStatus.CANCELLED,
      currentProgress: body.currentProgress,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a focus session' })
  update(@Param('id') id: string, @Body() updateFocusTimerDto: UpdateFocusTimerDto) {
    return this.focusTimerService.update(id, updateFocusTimerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a focus session' })
  delete(@Param('id') id: string) {
    return this.focusTimerService.delete(id);
  }
}
