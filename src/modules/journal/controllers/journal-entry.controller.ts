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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JournalEntryService } from '../services/journal-entry.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('Journal')
@ApiBearerAuth('access-token')
@Roles(Role.USER)
@Controller('journal/entries')
export class JournalEntryController {
  constructor(private readonly journalEntryService: JournalEntryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sermon or devotional journal entry (USER only)' })
  create(@Body() createJournalEntryDto: CreateJournalEntryDto) {
    return this.journalEntryService.create(createJournalEntryDto);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's journal entries (USER only)" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  findByUser(
    @Query('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.journalEntryService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific journal entry by ID (USER only)' })
  findOne(@Param('id') id: string) {
    return this.journalEntryService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update any fields of an existing journal entry (USER only)' })
  update(@Param('id') id: string, @Body() updateJournalEntryDto: UpdateJournalEntryDto) {
    return this.journalEntryService.update(id, updateJournalEntryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete a journal entry (USER only)' })
  delete(@Param('id') id: string) {
    return this.journalEntryService.delete(id);
  }
}
