import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { SecondTimerDocument } from '../schemas/second-timer.schema';
import { SecondTimerRepository } from '../repositories/second-timer.repository';
import {
  parseSpreadsheet,
  deduplicateRows,
  BulkUploadResult,
} from 'src/core/utils/spreadsheet.parser';

@Injectable()
export class SecondTimerService extends BaseService<SecondTimerDocument> {
  constructor(private secondTimerRepository: SecondTimerRepository) {
    super(secondTimerRepository);
  }

  async findByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.secondTimerRepository.findByOrganization(organizationId, pagination);
  }

  async findByFirstTimer(firstTimerId: string) {
    return this.secondTimerRepository.findByFirstTimer(firstTimerId);
  }

  async bulkCreate(
    buffer: Buffer,
    organizationId: string,
  ): Promise<BulkUploadResult> {
    const rows = parseSpreadsheet(buffer, ['name', 'phone_number']);
    const { unique, duplicatesInFile } = deduplicateRows(rows, 'phone_number');

    const existingPhones = await this.secondTimerRepository.findExistingPhones(
      organizationId,
      unique.map((r) => r.phone_number),
    );
    const existingSet = new Set(existingPhones);

    const invalidRows: BulkUploadResult['invalidRows'] = [];
    const toInsert: any[] = [];
    let skippedDb = 0;

    for (let i = 0; i < unique.length; i++) {
      const row = unique[i];

      if (existingSet.has(row.phone_number)) {
        skippedDb++;
        continue;
      }
      if (!row.name) {
        invalidRows.push({ row: i + 2, errors: ['name is required'] });
        continue;
      }

      // Resolve firstTimerId from spreadsheet column or by phone lookup
      let firstTimerId = row.first_timer_id || null;
      if (!firstTimerId) {
        firstTimerId = await this.secondTimerRepository.findFirstTimerByPhone(
          organizationId,
          row.phone_number,
        );
      }
      if (!firstTimerId) {
        invalidRows.push({
          row: i + 2,
          errors: [
            'No matching first-timer found. Provide first_timer_id or ensure the phone matches an existing first-timer.',
          ],
        });
        continue;
      }

      toInsert.push({
        organizationId,
        firstTimerId,
        name: row.name,
        phoneNumber: row.phone_number,
        email: row.email || '',
        prayerRequest: row.prayer_request || null,
        status: 'SECOND_TIMER',
      });
    }

    const inserted = await this.secondTimerRepository.bulkInsert(toInsert);
    return {
      inserted,
      skippedDuplicates: duplicatesInFile + skippedDb,
      invalidRows,
    };
  }
}
