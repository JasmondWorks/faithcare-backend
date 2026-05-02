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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SecondTimerService } from '../services/second-timer.service';
import { CreateSecondTimerDto } from '../dto/create-second-timer.dto';
import { UpdateSecondTimerDto } from '../dto/update-second-timer.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('ChurchCare — Second Timers')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('organizations/:organizationId/second-timers')
export class SecondTimerController {
  constructor(private readonly secondTimerService: SecondTimerService) {}

  @Post()
  @ApiOperation({
    summary: 'Record a second visit for a first-timer (ADMIN only)',
    description:
      'Creates a second-timer record linked to an existing first-timer. ' +
      'Indicates the visitor returned for a second service.',
  })
  @ApiResponse({ status: 201, description: 'Second-timer record created' })
  @ApiResponse({ status: 404, description: 'First-timer not found' })
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateSecondTimerDto,
  ) {
    return this.secondTimerService.create({ ...createDto, organizationId });
  }

  @Get()
  @ApiOperation({
    summary: 'List all second-timer records for the organization (ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'List of second-timer records' })
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.secondTimerService.findByOrganization(organizationId);
  }

  @Get('first-timer/:firstTimerId')
  @ApiOperation({
    summary: "List all second-timer records for a specific first-timer (ADMIN only)",
  })
  @ApiResponse({ status: 200, description: "List of second-timer records for the first-timer" })
  findByFirstTimer(@Param('firstTimerId') firstTimerId: string) {
    return this.secondTimerService.findByFirstTimer(firstTimerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a second-timer record by ID (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Second-timer record' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  findOne(@Param('id') id: string) {
    return this.secondTimerService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a second-timer record (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Updated record' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSecondTimerDto) {
    return this.secondTimerService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a second-timer record (ADMIN only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  delete(@Param('id') id: string) {
    return this.secondTimerService.delete(id);
  }
}
