import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SalvationRecordService } from '../services/salvation-record.service';
import { CreateSalvationRecordDto } from '../dto/create-salvation-record.dto';
import { UpdateSalvationRecordDto } from '../dto/update-salvation-record.dto';

@Controller('organizations/:organizationId/salvation-records')
export class SalvationRecordController {
  constructor(private readonly salvationRecordService: SalvationRecordService) {}

  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateSalvationRecordDto,
  ) {
    return this.salvationRecordService.create({ ...createDto, organizationId });
  }

  @Get()
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.salvationRecordService.findByOrganization(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salvationRecordService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSalvationRecordDto) {
    return this.salvationRecordService.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.salvationRecordService.delete(id);
  }
}
