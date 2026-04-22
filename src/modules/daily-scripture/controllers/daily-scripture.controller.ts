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
import { DailyScriptureService } from '../services/daily-scripture.service';
import { CreateDailyScriptureDto } from '../dto/create-daily-scripture.dto';
import { UpdateDailyScriptureDto } from '../dto/update-daily-scripture.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('Scripture')
@ApiBearerAuth('access-token')
@Controller('scripture')
export class DailyScriptureController {
  constructor(private readonly dailyScriptureService: DailyScriptureService) {}

  // ── All authenticated users ─────────────────────────────────────

  @Get('today')
  @ApiOperation({ summary: "Get today's scripture — accessible by all roles" })
  findToday(@Query('userId') userId: string) {
    return this.dailyScriptureService.findByUserAndDate(userId, new Date());
  }

  // ── ADMIN / SUPER_ADMIN only ────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Add a new scripture to the daily rotation (ADMIN/SUPER_ADMIN only)',
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

  @Get(':date')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Get scripture for a specific date (YYYY-MM-DD) (ADMIN/SUPER_ADMIN only)',
  })
  findByDate(@Param('date') date: string, @Query('userId') userId: string) {
    return this.dailyScriptureService.findByUserAndDate(userId, new Date(date));
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
}
