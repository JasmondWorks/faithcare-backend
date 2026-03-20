import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { JournalEntryDocument } from '../schemas/journal-entry.schema';
import { JournalEntryRepository } from '../repositories/journal-entry.repository';

@Injectable()
export class JournalEntryService extends BaseService<JournalEntryDocument> {
  constructor(private journalEntryRepository: JournalEntryRepository) {
    super(journalEntryRepository);
  }

  async findByUser(userId: string) {
    return this.journalEntryRepository.findByUser(userId);
  }
}
