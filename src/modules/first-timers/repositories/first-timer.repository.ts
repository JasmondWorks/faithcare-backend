import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { FirstTimer, FirstTimerDocument } from '../schemas/first-timer.schema';

@Injectable()
export class FirstTimerRepository extends BaseRepository<FirstTimerDocument> {
  constructor(
    @InjectModel(FirstTimer.name)
    firstTimerModel: Model<FirstTimerDocument>,
  ) {
    super(firstTimerModel);
  }

  /**
   * Upsert by (organizationId + phoneNumber).
   * If a record exists for this phone in this org, the mutable fields
   * (name, email, prayerRequest, visitType, serviceDate) are updated —
   * status and followUpScheduledAt are only written on first creation.
   * Returns { doc, created: boolean }.
   */
  async upsertByPhone(
    organizationId: string,
    phoneNumber: string,
    data: {
      name: string;
      email?: string | null;
      prayerRequest?: string | null;
      visitType: string;
      serviceDate: string;
      followUpScheduledAt: Date;
    },
  ): Promise<{ doc: FirstTimerDocument; created: boolean }> {
    const now = new Date();
    const result = await this.model
      .findOneAndUpdate(
        { organizationId, phoneNumber, isDeleted: { $ne: true } },
        {
          // Always update these — corrects typos and records the latest visit
          $set: {
            name: data.name,
            email: data.email ?? null,
            prayerRequest: data.prayerRequest ?? null,
            visitType: data.visitType,
            serviceDate: data.serviceDate,
            updatedAt: now,
          },
          // Only written when a new document is inserted
          $setOnInsert: {
            organizationId,
            phoneNumber,
            status: 'PENDING',
            followUpScheduledAt: data.followUpScheduledAt,
            isDeleted: false,
            createdAt: now,
          },
        },
        { upsert: true, new: true, includeResultMetadata: true },
      )
      .exec();

    const doc = result.value as FirstTimerDocument;
    const created = !result.lastErrorObject?.updatedExisting;
    return { doc, created };
  }

  async findByOrganization(
    organizationId: string,
    filters?: { status?: string; visitType?: string },
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    const query: Record<string, any> = { organizationId };
    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters?.visitType) {
      query.visitType = filters.visitType;
    }
    return this.paginate(query, { ...pagination, sort: { createdAt: -1 } });
  }

  async findExistingPhones(
    organizationId: string,
    phones: string[],
  ): Promise<string[]> {
    const docs = await this.model
      .find(
        {
          organizationId,
          phoneNumber: { $in: phones },
          isDeleted: { $ne: true },
        },
        'phoneNumber',
      )
      .lean()
      .exec();
    return (docs as any[]).map((d) => d.phoneNumber as string);
  }

  async bulkInsert(docs: any[]): Promise<number> {
    if (!docs.length) return 0;
    const result = await this.model.insertMany(docs, { ordered: false });
    return result.length;
  }

  async findDueFollowUps() {
    return this.model
      .find({
        status: 'PENDING',
        followUpScheduledAt: { $lte: new Date() },
        isDeleted: { $ne: true },
      })
      .exec();
  }
}
