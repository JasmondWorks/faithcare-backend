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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SecondTimerService } from '../services/second-timer.service';
import { CreateSecondTimerDto } from '../dto/create-second-timer.dto';
import { UpdateSecondTimerDto } from '../dto/update-second-timer.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { PaginationDto } from 'src/core/dto/pagination.dto';

@ApiTags('ChurchCare — Second Timers')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('church/second-timers')
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
    @CurrentUser() user: RequestUser,
    @Body() createDto: CreateSecondTimerDto,
  ) {
    return this.secondTimerService.create({ ...createDto, organizationId: user.organizationId! });
  }

  @Get()
  @ApiOperation({
    summary: "List all second-timer records for the authenticated admin's org (ADMIN only)",
  })
  @ApiResponse({ status: 200, description: 'List of second-timer records' })
  findByOrganization(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.secondTimerService.findByOrganization(user.organizationId!, pagination);
  }

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Bulk-upload second-timer records from a spreadsheet (ADMIN only)',
    description:
      'Accepts `.xlsx` or `.csv`. **Required columns:** `name`, `phone_number`. ' +
      '**Optional columns:** `email`, `prayer_request`, `first_timer_id`. ' +
      'If `first_timer_id` is omitted, the system tries to find a matching first-timer by phone number. ' +
      'Rows with no matching first-timer are reported in `invalidRows`.',
  })
  @ApiResponse({ status: 201, description: 'Import summary' })
  @ApiResponse({ status: 400, description: 'Missing required columns or unreadable file' })
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.secondTimerService.bulkCreate(file.buffer, user.organizationId!);
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
