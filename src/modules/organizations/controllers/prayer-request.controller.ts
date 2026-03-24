import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrayerRequestService } from '../services/prayer-request.service';
import { CreatePrayerRequestDto } from '../dto/create-prayer-request.dto';
import { UpdatePrayerRequestDto } from '../dto/update-prayer-request.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('Organization — Prayer Requests')
@ApiBearerAuth('access-token')
@Controller('organizations/:organizationId/prayer-requests')
export class PrayerRequestController {
  constructor(private readonly prayerRequestService: PrayerRequestService) {}

  // ── USER only ───────────────────────────────────────────────────

  @Post()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Submit a prayer request (USER only)' })
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreatePrayerRequestDto,
  ) {
    return this.prayerRequestService.create({ ...createDto, organizationId });
  }

  // ── ADMIN / SUPER_ADMIN only ────────────────────────────────────

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all prayer requests for the organization (ADMIN/SUPER_ADMIN only)' })
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.prayerRequestService.findByOrganization(organizationId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a single prayer request (ADMIN/SUPER_ADMIN only)' })
  findOne(@Param('id') id: string) {
    return this.prayerRequestService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a prayer request status (ADMIN/SUPER_ADMIN only)' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePrayerRequestDto) {
    return this.prayerRequestService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a prayer request (ADMIN/SUPER_ADMIN only)' })
  delete(@Param('id') id: string) {
    return this.prayerRequestService.delete(id);
  }
}
