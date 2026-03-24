import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('ChurchCare — Dashboard')
@ApiBearerAuth()
@Controller('church/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Aggregate follow-up counts and metrics' })
  getSummary(@Query('organizationId') organizationId: string) {
    return this.dashboardService.getSummary(organizationId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Weekly first-timer and follow-up trend data for charts' })
  getTrends(
    @Query('organizationId') organizationId: string,
    @Query('weeks') weeks?: number,
  ) {
    return this.dashboardService.getWeeklyTrends(organizationId, weeks);
  }
}
