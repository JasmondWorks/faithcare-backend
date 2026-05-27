import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JournalEntryService } from '../services/journal-entry.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { PaginationDto } from 'src/core/dto/pagination.dto';

@ApiTags('Journal')
@ApiBearerAuth('access-token')
@Roles(Role.USER)
@Controller('journal/entries')
export class JournalEntryController {
  constructor(private readonly journalEntryService: JournalEntryService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new sermon or devotional journal entry (USER only)',
  })
  create(
    @Body() createJournalEntryDto: CreateJournalEntryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.journalEntryService.create({ ...createJournalEntryDto, userId: user.id });
  }

  @Get()
  @ApiOperation({
    summary: "List the authenticated user's journal entries (USER only)",
  })
  findByUser(@CurrentUser() user: RequestUser, @Query() pagination: PaginationDto) {
    return this.journalEntryService.findByUser(user.id, pagination);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve a specific journal entry by ID (USER only)',
  })
  findOne(@Param('id') id: string) {
    return this.journalEntryService.findById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update any fields of an existing journal entry (USER only)',
  })
  update(
    @Param('id') id: string,
    @Body() updateJournalEntryDto: UpdateJournalEntryDto,
  ) {
    return this.journalEntryService.update(id, updateJournalEntryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete a journal entry (USER only)' })
  delete(@Param('id') id: string) {
    return this.journalEntryService.delete(id);
  }
}
