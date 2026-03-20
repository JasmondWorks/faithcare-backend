import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PrayerRequestService } from '../services/prayer-request.service';
import { CreatePrayerRequestDto } from '../dto/create-prayer-request.dto';
import { UpdatePrayerRequestDto } from '../dto/update-prayer-request.dto';

@Controller('organizations/:organizationId/prayer-requests')
export class PrayerRequestController {
  constructor(private readonly prayerRequestService: PrayerRequestService) {}

  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreatePrayerRequestDto,
  ) {
    return this.prayerRequestService.create({ ...createDto, organizationId });
  }

  @Get()
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.prayerRequestService.findByOrganization(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prayerRequestService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePrayerRequestDto) {
    return this.prayerRequestService.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prayerRequestService.delete(id);
  }
}
