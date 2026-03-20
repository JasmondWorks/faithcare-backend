import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserMetaDataService } from '../services/user-metadata.service';
import { CreateUserMetaDataDto } from '../dto/create-user-metadata.dto';
import { UpdateUserMetaDataDto } from '../dto/update-user-metadata.dto';

@Controller('users/metadata')
export class UserMetaDataController {
  constructor(private readonly userMetaDataService: UserMetaDataService) {}

  @Post()
  create(@Body() createUserMetaDataDto: CreateUserMetaDataDto) {
    return this.userMetaDataService.create(createUserMetaDataDto);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.userMetaDataService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userMetaDataService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserMetaDataDto: UpdateUserMetaDataDto) {
    return this.userMetaDataService.update(id, updateUserMetaDataDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userMetaDataService.delete(id);
  }
}
