import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Self ──────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the full profile of the authenticated user derived from the Bearer token. Password is never included in the response.',
  })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  async getMe(@CurrentUser() user: any) {
    return this.usersService.getMe(user.id);
  }

  // ── Admin ─────────────────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a user record (ADMIN/SUPER_ADMIN only)' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'List all users (ADMIN/SUPER_ADMIN only)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('email/:email')
  @ApiOperation({ summary: 'Find a user by email (ADMIN/SUPER_ADMIN only)' })
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID (ADMIN/SUPER_ADMIN only)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (ADMIN/SUPER_ADMIN only)' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user (ADMIN/SUPER_ADMIN only)' })
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
