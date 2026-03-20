import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FirstTimerService } from '../services/first-timer.service';
import { CreateFirstTimerDto } from '../dto/create-first-timer.dto';
import { UpdateFirstTimerStatusDto } from '../dto/update-first-timer-status.dto';

@ApiTags('ChurchCare — First Timers')
@Controller('church/first-timers')
export class FirstTimerController {
  constructor(private readonly firstTimerService: FirstTimerService) {}

  @Post()
  @ApiOperation({ summary: 'Submit first/second-timer registration — public endpoint' })
  create(@Body() createDto: CreateFirstTimerDto) {
    return this.firstTimerService.create({
      ...createDto,
      followUpScheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
    });
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paginated list of all first timers — Admin JWT required' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONTACTED', 'FOLLOWED_UP', 'all'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'from_date', required: false, type: String })
  @ApiQuery({ name: 'to_date', required: false, type: String })
  @ApiQuery({ name: 'visit_type', required: false, enum: ['first_time', 'second_time'] })
  findAll(
    @Query('organizationId') organizationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('visit_type') visitType?: string,
  ) {
    return this.firstTimerService.findByOrganization(organizationId);
  }

  @Get('export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export first timer records as CSV or Excel file' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'xlsx'] })
  export(@Query('organizationId') organizationId: string) {
    // CSV/Excel export — to be implemented with a file generation library
    return { message: 'Export feature coming soon' };
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full details of a specific first timer record' })
  findOne(@Param('id') id: string) {
    return this.firstTimerService.findById(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle follow-up status and add contact notes' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFirstTimerStatusDto,
  ) {
    return this.firstTimerService.update(id, updateStatusDto);
  }
}
