import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserMetaDataService } from '../services/user-metadata.service';
import { CreateUserMetaDataDto } from '../dto/create-user-metadata.dto';
import { UpdateUserMetaDataDto } from '../dto/update-user-metadata.dto';
import { ConnectChurchDto } from '../dto/connect-church.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { RequestUser } from 'src/core/types/request-user.interface';

@ApiTags('Users — Metadata')
@ApiBearerAuth('access-token')
@Roles(Role.USER)
@Controller('users/metadata')
export class UserMetaDataController {
  constructor(private readonly userMetaDataService: UserMetaDataService) { }

  @Post()
  @ApiOperation({ summary: 'Create user metadata record (USER only)' })
  create(
    @Body() createUserMetaDataDto: CreateUserMetaDataDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userMetaDataService.create({
      ...createUserMetaDataDto,
      userId: user.id,
    });
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get own metadata — includes populated church info (USER only)',
  })
  getMyMetadata(@CurrentUser() user: RequestUser) {
    return this.userMetaDataService.findByUserId(user.id);
  }

  @Get('me/dashboard')
  @ApiOperation({
    summary: 'Get personal growth dashboard stats (USER only)',
    description:
      'Returns aggregated stats for the personal dashboard: login streak, journaling streak, ' +
      'scripture reading streak and total count, focus session count with recent sessions, ' +
      'latest memorization activity, and a 30-day consistency heatmap.',
  })
  getDashboard(@CurrentUser() user: RequestUser) {
    return this.userMetaDataService.getDashboard(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get metadata by record ID (USER only)' })
  findOne(@Param('id') id: string) {
    return this.userMetaDataService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update metadata fields (USER only)' })
  update(
    @Param('id') id: string,
    @Body() updateUserMetaDataDto: UpdateUserMetaDataDto,
  ) {
    return this.userMetaDataService.update(id, updateUserMetaDataDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user metadata (USER only)' })
  deleteMetadata(@Param('id') id: string) {
    return this.userMetaDataService.deleteMetadata(id);
  }

  @Patch('me/church')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connect to a church (USER only)',
    description:
      "Updates the authenticated user's church affiliation. " +
      'Provide `organization` (a MongoDB ObjectId) if the church was found via search, ' +
      'or `churchName` (a free-text string) if it was not. Only one field should be sent.',
  })
  connectToChurch(
    @CurrentUser() user: RequestUser,
    @Body() dto: ConnectChurchDto,
  ) {
    return this.userMetaDataService.connectToChurch(user.id, dto);
  }
}
