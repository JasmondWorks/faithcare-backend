import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SalvationRecordService } from '../services/salvation-record.service';
import { CreateSalvationRecordDto } from '../dto/create-salvation-record.dto';
import { UpdateSalvationRecordDto } from '../dto/update-salvation-record.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('Organization — Salvation Records')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('organizations/:organizationId/salvation-records')
export class SalvationRecordController {
  constructor(
    private readonly salvationRecordService: SalvationRecordService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Record a salvation decision (ADMIN/SUPER_ADMIN only)',
  })
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateSalvationRecordDto,
  ) {
    return this.salvationRecordService.create({ ...createDto, organizationId });
  }

  @Get()
  @ApiOperation({
    summary:
      'List all salvation records for the organization (ADMIN/SUPER_ADMIN only)',
  })
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.salvationRecordService.findByOrganization(organizationId);
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
