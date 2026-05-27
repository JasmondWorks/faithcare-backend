import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/core/services/base.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FirstTimerDocument } from '../schemas/first-timer.schema';
import { FirstTimerRepository } from '../repositories/first-timer.repository';
import {
  parseSpreadsheet,
  deduplicateRows,
  BulkUploadResult,
} from 'src/core/utils/spreadsheet.parser';

@Injectable()
export class FirstTimerService extends BaseService<FirstTimerDocument> {
  constructor(
    private firstTimerRepository: FirstTimerRepository,
    private notifications: NotificationsService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    super(firstTimerRepository);
  }

  /**
   * Verifies a QR code token and returns the embedded org details.
   * Called by the public registration page before showing the form.
   */
  verifyQrToken(token: string): { orgId: string; slug: string; name: string } {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.qrSecret') as string,
      });
      if (payload.type !== 'qr_registration') throw new Error();
      return { orgId: payload.sub, slug: payload.slug, name: payload.name };
    } catch {
      throw new UnauthorizedException(
        'QR code is invalid or has expired. Please ask the admin to regenerate.',
      );
    }
  }

  async create(data: any): Promise<FirstTimerDocument> {
    const { doc } = await this._upsert(data);
    return doc;
  }

  /** Used by the public QR registration endpoint — returns the created flag. */
  async registerFromQr(
    data: any,
  ): Promise<{ record: FirstTimerDocument; created: boolean }> {
    const { doc, created } = await this._upsert(data);
    return { record: doc, created };
  }

  private async _upsert(
    data: any,
  ): Promise<{ doc: FirstTimerDocument; created: boolean }> {
    const { doc, created } = await this.firstTimerRepository.upsertByPhone(
      data.organizationId,
      data.phoneNumber,
      {
        name: data.name,
        email: data.email,
        prayerRequest: data.prayerRequest,
        visitType: data.visitType ?? 'first_time',
        serviceDate: data.serviceDate,
        followUpScheduledAt:
          data.followUpScheduledAt ??
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    );

    if (created) {
      const orgId = String(doc.organizationId ?? '');
      if (orgId) {
        this.notifications.notifyNewFirstTimer(orgId, {
          id: String((doc as any)._id),
          name: doc.name,
          visitType: doc.visitType,
          organizationId: orgId,
        });
      }
    }

    return { doc, created };
  }

  async findByOrganization(
    organizationId: string,
    filters?: { status?: string; visitType?: string },
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.firstTimerRepository.findByOrganization(organizationId, filters, pagination);
  }

  async findDueFollowUps() {
    return this.firstTimerRepository.findDueFollowUps();
  }

  async bulkCreate(
    buffer: Buffer,
    organizationId: string,
  ): Promise<BulkUploadResult> {
    const rows = parseSpreadsheet(buffer, ['name', 'phone_number']);
    const { unique, duplicatesInFile } = deduplicateRows(rows, 'phone_number');

    const existingPhones = await this.firstTimerRepository.findExistingPhones(
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
        prayerRequest: row.prayer_request || null,
        serviceDate: row.visit_date || null,
        notes: row.notes || null,
        visitType:
          row.visit_type === 'second_time' ? 'second_time' : 'first_time',
        status: 'PENDING',
        followUpScheduledAt: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ),
      });
    });

    const inserted = await this.firstTimerRepository.bulkInsert(toInsert);
    return {
      inserted,
      skippedDuplicates: duplicatesInFile + skippedDb,
      invalidRows,
    };
  }
}
