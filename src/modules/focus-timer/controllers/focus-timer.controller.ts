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
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { PaginationDto } from 'src/core/dto/pagination.dto';

@ApiTags('Focus Timer')
@ApiBearerAuth('access-token')
@Roles(Role.USER)
@Controller('timer/sessions')
export class FocusTimerController {
  constructor(private readonly focusTimerService: FocusTimerService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new focus session (USER only)' })
  create(
    @Body() createFocusTimerDto: CreateFocusTimerDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.focusTimerService.create({ ...createFocusTimerDto, userId: user.id });
  }

  @Get()
  @ApiOperation({
    summary: 'List all focus sessions with summary stats (USER only)',
  })
  findByUser(@CurrentUser() user: RequestUser, @Query() pagination: PaginationDto) {
    return this.focusTimerService.findByUser(user.id, pagination);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get the currently active focus session (USER only)',
  })
  findActive(@CurrentUser() user: RequestUser) {
    return this.focusTimerService.findActiveByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific focus session by ID (USER only)' })
  findOne(@Param('id') id: string) {
    return this.focusTimerService.findById(id);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Complete a session — returns scripture reward (USER only)',
  })
  complete(@Param('id') id: string) {
    return this.focusTimerService.update(id, {
      status: FocusTimerStatus.COMPLETED,
    });
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause a running focus session (USER only)' })
  pause(@Param('id') id: string, @Body() body: { currentProgress: number }) {
    return this.focusTimerService.update(id, {
      status: FocusTimerStatus.CANCELLED,
      currentProgress: body.currentProgress,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a focus session (USER only)' })
  update(
    @Param('id') id: string,
    @Body() updateFocusTimerDto: UpdateFocusTimerDto,
  ) {
    return this.focusTimerService.update(id, updateFocusTimerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a focus session (USER only)' })
  delete(@Param('id') id: string) {
    return this.focusTimerService.delete(id);
  }
}
