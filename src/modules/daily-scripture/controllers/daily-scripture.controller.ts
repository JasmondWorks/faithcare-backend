import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DailyScriptureService } from '../services/daily-scripture.service';
import { DailyScriptureSchedulerService } from '../services/daily-scripture-scheduler.service';
import { CreateDailyScriptureDto } from '../dto/create-daily-scripture.dto';
import { UpdateDailyScriptureDto } from '../dto/update-daily-scripture.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('Scripture')
@ApiBearerAuth('access-token')
@Controller('scripture')
export class DailyScriptureController {
  constructor(
    private readonly dailyScriptureService: DailyScriptureService,
    private readonly schedulerService: DailyScriptureSchedulerService,
  ) {}

  // ── Global daily verse (Bible API) ──────────────────────────────

  @Get('global/today')
  @ApiOperation({
    summary:
      "Get today's shared verse of the day (no auth required context — all users see the same verse)",
    description:
      'Fetches from the Bible API (ourmanna.com) on first request of the day, then serves ' +
      'the cached MongoDB result for subsequent calls. Returns null if the API is unavailable.',
  })
  getTodayGlobalVerse() {
    return this.schedulerService.fetchTodayOrTrigger();
  }

  @Post('global/fetch')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger a Bible API fetch for today (ADMIN only)',
  })
  async triggerFetch() {
    await this.schedulerService.fetchAndStoreDailyVerse();
    return this.schedulerService.fetchTodayOrTrigger();
  }

  // ── Per-user scripture (auto-created from global verse) ─────────

  @Get('today')
  @ApiOperation({
    summary: "Get today's verse for the authenticated user",
    description:
      'Auto-fetches the global verse from the Bible API, then finds or creates ' +
      'a per-user record so the user can track reading completion. ' +
      'Use PATCH /scripture/:id/complete to mark it read.',
  })
  getTodayForUser(@CurrentUser() user: RequestUser) {
    return this.dailyScriptureService.getTodayForUser(user.id);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark today's scripture as read/completed" })
  markCompleted(@Param('id') id: string) {
    return this.dailyScriptureService.markCompleted(id);
  }

  @Get('history')
  @ApiOperation({
    summary: "Get the authenticated user's scripture reading history",
  })
  getHistory(@CurrentUser() user: RequestUser) {
    return this.dailyScriptureService.findByUser(user.id);
  }

  // ── ADMIN only ──────────────────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Manually create a per-user scripture entry (ADMIN only)',
  })
  create(@Body() dto: CreateDailyScriptureDto) {
    return this.dailyScriptureService.create(dto);
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "List a specific user's scripture history (ADMIN only)",
  })
  findByUser(@Param('userId') userId: string) {
    return this.dailyScriptureService.findByUser(userId);
  }

  @Get('user/:userId/date/:date')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Get a specific user's scripture entry for a date (ADMIN only)",
    description: 'Date format: YYYY-MM-DD',
  })
  findByDate(@Param('userId') userId: string, @Param('date') date: string) {
    return this.dailyScriptureService.findByUserAndDate(userId, new Date(date));
  }

  @Patch('reminder/preferences')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Set reminder preferences (ADMIN only — stub)' })
  updateReminderPreferences(@Body() _body: any) {
    return { success: true, message: 'Preferences saved' };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a scripture entry (ADMIN only)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateDailyScriptureDto) {
    return this.dailyScriptureService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a scripture entry (ADMIN only)' })
  delete(@Param('id') id: string) {
    return this.dailyScriptureService.delete(id);
  }
}
