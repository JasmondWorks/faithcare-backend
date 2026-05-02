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
  async create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateSalvationRecordDto,
  ) {
    const data = await this.salvationRecordService.create({ ...createDto, organizationId });
    return { success: true, data };
  }

  @Get()
  @ApiOperation({
    summary:
      'List all salvation records for the organization (ADMIN/SUPER_ADMIN only)',
  })
  async findByOrganization(@Param('organizationId') organizationId: string) {
    const data = await this.salvationRecordService.findByOrganization(organizationId);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a salvation record by ID (ADMIN/SUPER_ADMIN only)',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.salvationRecordService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a salvation record (ADMIN/SUPER_ADMIN only)',
  })
  async update(@Param('id') id: string, @Body() updateDto: UpdateSalvationRecordDto) {
    const data = await this.salvationRecordService.update(id, updateDto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a salvation record (ADMIN/SUPER_ADMIN only)',
  })
  async delete(@Param('id') id: string) {
    await this.salvationRecordService.delete(id);
    return { success: true };
  }
}
