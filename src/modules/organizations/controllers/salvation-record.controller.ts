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
import { SalvationRecordService } from '../services/salvation-record.service';
import { CreateSalvationRecordDto } from '../dto/create-salvation-record.dto';
import { UpdateSalvationRecordDto } from '../dto/update-salvation-record.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { PaginationDto } from 'src/core/dto/pagination.dto';

@ApiTags('Organization — Salvation Records')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('church/salvation-records')
export class SalvationRecordController {
  constructor(
    private readonly salvationRecordService: SalvationRecordService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Record a salvation decision (ADMIN/SUPER_ADMIN only)',
  })
  create(
    @CurrentUser() user: RequestUser,
    @Body() createDto: CreateSalvationRecordDto,
  ) {
    return this.salvationRecordService.create({ ...createDto, organizationId: user.organizationId! });
  }

  @Get()
  @ApiOperation({
    summary: "List all salvation records for the authenticated admin's org (ADMIN/SUPER_ADMIN only)",
  })
  findByOrganization(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.salvationRecordService.findByOrganization(user.organizationId!, pagination);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a salvation record by ID (ADMIN/SUPER_ADMIN only)',
  })
  findOne(@Param('id') id: string) {
    return this.salvationRecordService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a salvation record (ADMIN/SUPER_ADMIN only)',
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateSalvationRecordDto) {
    return this.salvationRecordService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a salvation record (ADMIN/SUPER_ADMIN only)',
  })
  delete(@Param('id') id: string) {
    return this.salvationRecordService.delete(id);
  }
}
