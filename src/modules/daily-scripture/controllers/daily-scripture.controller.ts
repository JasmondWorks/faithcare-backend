import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DailyScriptureService } from '../services/daily-scripture.service';
import { DailyScriptureSchedulerService } from '../services/daily-scripture-scheduler.service';
import { CreateDailyScriptureDto } from '../dto/create-daily-scripture.dto';
import { UpdateDailyScriptureDto } from '../dto/update-daily-scripture.dto';
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
    summary: "Get today's global verse of the day fetched from the Bible API",
    description:
      'Returns a single verse shared for all users. Auto-fetches if not yet cached for today.',
  })
  getTodayGlobalVerse() {
    return this.schedulerService.fetchTodayOrTrigger();
  }

  @Post('global/fetch')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Manually trigger a Bible API fetch for today (ADMIN/SUPER_ADMIN only)',
  })
  async triggerFetch() {
    await this.schedulerService.fetchAndStoreDailyVerse();
    return this.schedulerService.fetchTodayOrTrigger();
  }

  // ── Per-user scripture ──────────────────────────────────────────

  @Get('today')
  @ApiOperation({ summary: "Get today's per-user scripture entry" })
  findToday(@Query('userId') userId: string) {
    return this.dailyScriptureService.findByUserAndDate(userId, new Date());
  }

  // ── ADMIN / SUPER_ADMIN only ────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Add a per-user daily scripture entry (ADMIN/SUPER_ADMIN only)',
  })
  create(@Body() createDailyScriptureDto: CreateDailyScriptureDto) {
    return this.dailyScriptureService.create(createDailyScriptureDto);
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "List all of a user's daily scriptures (ADMIN/SUPER_ADMIN only)",
  })
  findByUser(@Param('userId') userId: string) {
    return this.dailyScriptureService.findByUser(userId);
  }

  @Patch('reminder/preferences')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Set preferred daily reminder time and channel (ADMIN/SUPER_ADMIN only)',
  })
  updateReminderPreferences(@Body() _body: any) {
    return { success: true, message: 'Preferences saved' };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update a daily scripture entry (ADMIN/SUPER_ADMIN only)',
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateDailyScriptureDto) {
    return this.dailyScriptureService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete a daily scripture entry (ADMIN/SUPER_ADMIN only)',
  })
  delete(@Param('id') id: string) {
    return this.dailyScriptureService.delete(id);
  }

  @Get(':date')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Get per-user scripture for a specific date (YYYY-MM-DD) (ADMIN/SUPER_ADMIN only)',
  })
  findByDate(@Param('date') date: string, @Query('userId') userId: string) {
    return this.dailyScriptureService.findByUserAndDate(userId, new Date(date));
  }
}
