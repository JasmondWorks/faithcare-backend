import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrayerRequestService } from '../services/prayer-request.service';
import { CreatePrayerRequestDto } from '../dto/create-prayer-request.dto';
import { UpdatePrayerRequestDto } from '../dto/update-prayer-request.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { PaginationDto } from 'src/core/dto/pagination.dto';

@ApiTags('Organization — Prayer Requests')
@ApiBearerAuth('access-token')
@Controller('church/prayer-requests')
export class PrayerRequestController {
  constructor(private readonly prayerRequestService: PrayerRequestService) {}

  // ── USER only ───────────────────────────────────────────────────

  @Post()
  @Roles(Role.USER)
  @ApiOperation({
    summary: 'Submit a prayer request (USER only)',
    description:
      'The prayer request is submitted to the organization associated with the logged-in user.',
  })
  create(
    @CurrentUser() user: RequestUser,
    @Body() createDto: CreatePrayerRequestDto,
  ) {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with any organization');
    }
    return this.prayerRequestService.create({
      ...createDto,
      organizationId: user.organizationId,
    });
  }

  // ── ADMIN / SUPER_ADMIN only ────────────────────────────────────

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "List all prayer requests for the authenticated admin's org (ADMIN/SUPER_ADMIN only)",
  })
  findByOrganization(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.prayerRequestService.findByOrganization(user.organizationId!, pagination);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get a single prayer request (ADMIN/SUPER_ADMIN only)',
  })
  findOne(@Param('id') id: string) {
    return this.prayerRequestService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update a prayer request status (ADMIN/SUPER_ADMIN only)',
  })
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
