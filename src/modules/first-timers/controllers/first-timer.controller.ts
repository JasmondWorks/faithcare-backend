import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FirstTimerService } from '../services/first-timer.service';
import { CreateFirstTimerDto } from '../dto/create-first-timer.dto';
import { UpdateFirstTimerStatusDto } from '../dto/update-first-timer-status.dto';
import { Public } from 'src/core/decorators/public.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { PaginationDto } from 'src/core/dto/pagination.dto';

@ApiTags('ChurchCare — First Timers')
@Controller('church/first-timers')
export class FirstTimerController {
  constructor(private readonly firstTimerService: FirstTimerService) { }

  @Get('register/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a QR code token and return church info (public)',
    description:
      'Called by the frontend immediately after the visitor scans the QR code. ' +
      'Validates the signed token and returns the church name so the form can be personalised. ' +
      'Returns 401 if the token is expired or invalid — show an "expired QR code" message instead of the form.',
  })
  @ApiQuery({ name: 'token', required: true, type: String, description: 'QR code token from the URL' })
  @ApiResponse({ status: 200, description: '{ orgId, orgName, slug }' })
  @ApiResponse({ status: 401, description: 'Token expired or invalid' })
  verifyQr(@Query('token') token: string) {
    if (!token) throw new BadRequestException('token query param is required');
    const { orgId, slug, name } = this.firstTimerService.verifyQrToken(token);
    return { orgId, orgName: name, slug };
  }

  @Post()
  @Public()
  @ApiOperation({
    summary: 'Submit first/second-timer registration (QR-gated public endpoint)',
    description:
      'The `qrToken` from the QR code URL is required. The server verifies it and derives ' +
      '`organizationId` from the token — the form cannot be submitted with a forged org ID. ' +
      'The token must not be expired.',
  })
  @ApiResponse({ status: 201, description: 'Registration recorded' })
  @ApiResponse({ status: 401, description: 'QR token expired or invalid' })
  async create(@Body() createDto: CreateFirstTimerDto) {
    const { orgId } = this.firstTimerService.verifyQrToken(createDto.qrToken);
    const { record, created } = await this.firstTimerService.registerFromQr({
      ...createDto,
      organizationId: orgId,
      followUpScheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });
    return { success: true, data: record, created };
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
    @Query() pagination: PaginationDto = new PaginationDto(),
  ) {
    return this.firstTimerService.findByOrganization(
      user.organizationId!,
      { status, visitType },
      pagination,
    );
  }

  @Get('export')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export first timer records (ADMIN only — coming soon)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'xlsx'] })
  export(@CurrentUser() _user: RequestUser) {
    return { message: 'Export feature coming soon' };
  }

  @Post('bulk-upload')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Bulk-upload first timers from a spreadsheet (ADMIN only)',
    description:
      'Accepts `.xlsx` or `.csv`. **Required columns:** `name`, `phone_number`. ' +
      '**Optional columns:** `email`, `prayer_request`, `visit_date`, `notes`, `visit_type` (`first_time` | `second_time`). ' +
      'Duplicate phone numbers within the file and against existing DB records are skipped. ' +
      'Returns `inserted`, `skippedDuplicates`, and `invalidRows` with per-row errors.',
  })
  @ApiResponse({ status: 201, description: 'Import summary' })
  @ApiResponse({ status: 400, description: 'Missing required columns or unreadable file' })
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.firstTimerService.bulkCreate(
      file.buffer,
      user.organizationId!,
    );
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get full details of a specific first timer record (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'First timer record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.firstTimerService.findById(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update follow-up status and contact notes (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Updated record' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFirstTimerStatusDto,
  ) {
    return this.firstTimerService.update(id, updateStatusDto);
  }
}
