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
  constructor(private readonly userMetaDataService: UserMetaDataService) {}

  @Post()
  @ApiOperation({ summary: 'Create user metadata record (USER only)' })
  async create(
    @Body() createUserMetaDataDto: CreateUserMetaDataDto,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.userMetaDataService.create({
      ...createUserMetaDataDto,
      userId: user.id,
    });
    return { success: true, data };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get own metadata — includes populated church info (USER only)',
  })
  async getMyMetadata(@CurrentUser() user: RequestUser) {
    const data = await this.userMetaDataService.findByUserId(user.id);
    return { success: true, data: data || null };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get metadata by record ID (USER only)' })
  async findOne(@Param('id') id: string) {
    const data = await this.userMetaDataService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update metadata fields (USER only)' })
  async update(
    @Param('id') id: string,
    @Body() updateUserMetaDataDto: UpdateUserMetaDataDto,
  ) {
    const data = await this.userMetaDataService.update(id, updateUserMetaDataDto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete metadata record (USER only)' })
  async delete(@Param('id') id: string) {
    await this.userMetaDataService.delete(id);
    return { success: true };
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
  async connectToChurch(
    @CurrentUser() user: RequestUser,
    @Body() dto: ConnectChurchDto,
  ) {
    const data = await this.userMetaDataService.connectToChurch(user.id, dto);
    return { success: true, data };
  }
}
