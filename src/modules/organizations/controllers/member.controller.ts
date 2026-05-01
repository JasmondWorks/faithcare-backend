import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { MemberService } from '../services/member.service';
import { CreateMemberDto } from '../dto/create-member.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

class UpdateMemberDto extends PartialType(CreateMemberDto) {}

@ApiTags('Organization — Members')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('organizations/:organizationId/members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a regular church member (ADMIN only)',
    description:
      'Records a person who has moved beyond first/second visits and is now a regular member. ' +
      'These can be linked as the target of follow-up tasks.',
  })
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.memberService.create({ ...dto, organizationId });
  }

  @Get()
  @ApiOperation({
    summary: 'List all active members of the organization (ADMIN only)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Filter by name',
  })
  findAll(
    @Param('organizationId') organizationId: string,
    @Query('search') search?: string,
  ) {
    if (search) return this.memberService.searchByName(organizationId, search);
    return this.memberService.findByOrganization(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a member by ID (ADMIN only)' })
  findOne(@Param('id') id: string) {
    return this.memberService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a member record (ADMIN only)' })
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.memberService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member (ADMIN only)' })
  delete(@Param('id') id: string) {
    return this.memberService.softDelete(id);
  }
}
