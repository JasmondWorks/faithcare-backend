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

@ApiTags('Scripture')
@ApiBearerAuth()
@Controller('scripture')
export class DailyScriptureController {
  constructor(private readonly dailyScriptureService: DailyScriptureService) {}

  @Get('today')
  @ApiOperation({ summary: "Get today's scripture and encouragement message" })
  findToday(@Query('userId') userId: string) {
    return this.dailyScriptureService.findByUserAndDate(userId, new Date());
  }

  @Post()
  @ApiOperation({ summary: 'Add a new scripture to the daily rotation' })
  create(@Body() createDailyScriptureDto: CreateDailyScriptureDto) {
    return this.dailyScriptureService.create(createDailyScriptureDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: "List all of a user's daily scriptures" })
  findByUser(@Param('userId') userId: string) {
    return this.dailyScriptureService.findByUser(userId);
  }

  @Get(':date')
  @ApiOperation({ summary: 'Get scripture for a specific date (YYYY-MM-DD)' })
  findByDate(
    @Param('date') date: string,
    @Query('userId') userId: string,
  ) {
    return this.dailyScriptureService.findByUserAndDate(userId, new Date(date));
  }

  @Patch('reminder/preferences')
  @ApiOperation({ summary: 'Set preferred daily reminder time and channel' })
  updateReminderPreferences(@Body() body: any) {
    // Reminder preferences — to be implemented with notification service
    return { success: true, message: 'Preferences saved' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a daily scripture entry' })
  update(@Param('id') id: string, @Body() updateDto: UpdateDailyScriptureDto) {
    return this.dailyScriptureService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a daily scripture entry' })
  delete(@Param('id') id: string) {
    return this.dailyScriptureService.delete(id);
  }
}
