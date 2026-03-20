import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FollowUpService } from '../services/follow-up.service';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { UpdateFollowUpDto } from '../dto/update-follow-up.dto';

@Controller('organizations/:organizationId/follow-ups')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateFollowUpDto,
  ) {
    return this.followUpService.create({ ...createDto, organizationId });
  }

  @Get()
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.followUpService.findByOrganization(organizationId);
  }

  @Get('member/:newMemberId')
  findByMember(@Param('newMemberId') newMemberId: string) {
    return this.followUpService.findByMember(newMemberId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.followUpService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateFollowUpDto) {
    return this.followUpService.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.followUpService.delete(id);
  }
}
