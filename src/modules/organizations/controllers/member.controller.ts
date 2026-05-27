import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MemberService } from '../services/member.service';
import { CreateMemberDto } from '../dto/create-member.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { PaginationDto } from 'src/core/dto/pagination.dto';

class UpdateMemberDto extends PartialType(CreateMemberDto) {}

@ApiTags('Organization — Members')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('church/members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a regular church member (ADMIN only)',
    description:
      'Records a person who has moved beyond first/second visits and is now a regular member. ' +
      'These can be linked as the target of follow-up tasks.',
  })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateMemberDto,
  ) {
    return this.memberService.create({ ...dto, organizationId: user.organizationId! });
  }

  @Get()
  @ApiOperation({
    summary: "List all active members of the authenticated admin's org (ADMIN only)",
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Filter by name',
  })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('search') search?: string,
    @Query() pagination: PaginationDto = new PaginationDto(),
  ) {
    if (search) return this.memberService.searchByName(user.organizationId!, search);
    return this.memberService.findByOrganization(user.organizationId!, pagination);
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
    summary: 'Bulk-upload members from a spreadsheet (ADMIN only)',
    description:
      'Accepts `.xlsx` or `.csv`. **Required columns:** `name`, `phone_number`. ' +
      '**Optional columns:** `email`, `address`, `notes`, `joined_at` (YYYY-MM-DD), `status` (`ACTIVE` | `INACTIVE`). ' +
      'Duplicate phone numbers are skipped.',
  })
  @ApiResponse({ status: 201, description: 'Import summary' })
  @ApiResponse({ status: 400, description: 'Missing required columns or unreadable file' })
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.memberService.bulkCreate(file.buffer, user.organizationId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a member by ID (ADMIN only)' })
  findOne(@Param('id') id: string) {
    return this.memberService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a member record (ADMIN only)' })
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.memberService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member (ADMIN only)' })
  delete(@Param('id') id: string) {
    return this.memberService.softDelete(id);
  }
}
