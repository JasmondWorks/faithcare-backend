import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { MemberDocument } from '../schemas/member.schema';
import { MemberRepository } from '../repositories/member.repository';
import {
  parseSpreadsheet,
  deduplicateRows,
  BulkUploadResult,
} from 'src/core/utils/spreadsheet.parser';

@Injectable()
export class MemberService extends BaseService<MemberDocument> {
  constructor(private readonly memberRepository: MemberRepository) {
    super(memberRepository);
  }

  findByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.memberRepository.findByOrganization(organizationId, pagination);
  }

  searchByName(organizationId: string, query: string) {
    return this.memberRepository.searchByName(organizationId, query);
  }

  async bulkCreate(
    buffer: Buffer,
    organizationId: string,
  ): Promise<BulkUploadResult> {
    const rows = parseSpreadsheet(buffer, ['name', 'phone_number']);
    const { unique, duplicatesInFile } = deduplicateRows(rows, 'phone_number');

    const existingPhones = await this.memberRepository.findExistingPhones(
      organizationId,
      unique.map((r) => r.phone_number),
    );
    const existingSet = new Set(existingPhones);

    const invalidRows: BulkUploadResult['invalidRows'] = [];
    const toInsert: any[] = [];
    let skippedDb = 0;

    unique.forEach((row, i) => {
      if (existingSet.has(row.phone_number)) {
        skippedDb++;
        return;
      }
      if (!row.name) {
        invalidRows.push({ row: i + 2, errors: ['name is required'] });
        return;
      }
      toInsert.push({
        organizationId,
        name: row.name,
        phoneNumber: row.phone_number,
        email: row.email || null,
        address: row.address || null,
        notes: row.notes || null,
        joinedAt: row.joined_at ? new Date(row.joined_at) : null,
        status:
          row.status?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
    });

    const inserted = await this.memberRepository.bulkInsert(toInsert);
    return {
      inserted,
      skippedDuplicates: duplicatesInFile + skippedDb,
      invalidRows,
    };
  }
}
