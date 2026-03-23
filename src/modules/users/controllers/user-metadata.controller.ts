import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserMetaDataService } from '../services/user-metadata.service';
import { CreateUserMetaDataDto } from '../dto/create-user-metadata.dto';
import { UpdateUserMetaDataDto } from '../dto/update-user-metadata.dto';
import { ConnectChurchDto } from '../dto/connect-church.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users/metadata')
export class UserMetaDataController {
  constructor(private readonly userMetaDataService: UserMetaDataService) {}

  @Post()
  @ApiOperation({ summary: 'Create user metadata record' })
  create(@Body() createUserMetaDataDto: CreateUserMetaDataDto) {
    return this.userMetaDataService.create(createUserMetaDataDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get metadata by user ID (includes populated church info)' })
  findByUserId(@Param('userId') userId: string) {
    return this.userMetaDataService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get metadata by record ID' })
  findOne(@Param('id') id: string) {
    return this.userMetaDataService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update metadata fields' })
  update(@Param('id') id: string, @Body() updateUserMetaDataDto: UpdateUserMetaDataDto) {
    return this.userMetaDataService.update(id, updateUserMetaDataDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete metadata record' })
  delete(@Param('id') id: string) {
    return this.userMetaDataService.delete(id);
  }

  @Patch('me/church')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connect to a church',
    description:
      'Updates the authenticated user\'s church affiliation. ' +
      'Provide `organization` (a MongoDB ObjectId) if the church was found via search, ' +
      'or `churchName` (a free-text string) if it was not. Only one field should be sent.',
  })
  connectToChurch(
    @CurrentUser() user: any,
    @Body() dto: ConnectChurchDto,
  ) {
    return this.userMetaDataService.connectToChurch(user.sub, dto);
  }
}
