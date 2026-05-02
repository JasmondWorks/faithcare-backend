import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('ChurchCare — Dashboard')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('church/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Aggregate follow-up counts and metrics (ADMIN only)' })
  getSummary(@CurrentUser() user: RequestUser) {
    return this.dashboardService.getSummary(user.organizationId!);
  }

  @Get('trends')
  @ApiOperation({
    summary: 'Weekly first-timer and follow-up trend data for charts (ADMIN only)',
  })
  @ApiQuery({ name: 'weeks', required: false, type: Number })
  getTrends(
    @CurrentUser() user: RequestUser,
    @Query('weeks') weeks?: number,
  ) {
    return this.dashboardService.getWeeklyTrends(user.organizationId!, weeks);
  }
}
