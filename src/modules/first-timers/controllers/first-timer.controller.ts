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
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FirstTimerService } from '../services/first-timer.service';
import { CreateFirstTimerDto } from '../dto/create-first-timer.dto';
import { UpdateFirstTimerStatusDto } from '../dto/update-first-timer-status.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('ChurchCare — First Timers')
@Controller('church/first-timers')
export class FirstTimerController {
  constructor(private readonly firstTimerService: FirstTimerService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit first/second-timer registration — public endpoint',
  })
  async create(@Body() createDto: CreateFirstTimerDto) {
    const data = await this.firstTimerService.create({
      ...createDto,
      followUpScheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
    });
    return { success: true, data };
  }

  @Get()
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "List first timers for the authenticated admin's org (ADMIN only)",
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'CONTACTED', 'FOLLOWED_UP', 'all'],
    description: 'Filter by follow-up status',
  })
  @ApiQuery({
    name: 'visit_type',
    required: false,
    enum: ['first_time', 'second_time'],
    description: 'Filter by visit type',
  })
  @ApiResponse({ status: 200, description: 'List of first timers' })
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
    @Query('visit_type') visitType?: string,
  ) {
    const data = await this.firstTimerService.findByOrganization(
      user.organizationId!,
      { status, visitType },
    );
    return { success: true, data };
  }

  @Get('export')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export first timer records (ADMIN only — coming soon)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'xlsx'] })
  export(@CurrentUser() _user: RequestUser) {
    return { message: 'Export feature coming soon' };
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get full details of a specific first timer record (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'First timer record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.firstTimerService.findById(id);
    return { success: true, data };
  }

  @Patch(':id/status')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update follow-up status and contact notes (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Updated record' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFirstTimerStatusDto,
  ) {
    const data = await this.firstTimerService.update(id, updateStatusDto);
    return { success: true, data };
  }
}
