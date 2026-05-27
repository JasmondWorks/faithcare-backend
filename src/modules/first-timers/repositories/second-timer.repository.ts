import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  SecondTimer,
  SecondTimerDocument,
} from '../schemas/second-timer.schema';

@Injectable()
export class SecondTimerRepository extends BaseRepository<SecondTimerDocument> {
  constructor(
    @InjectModel(SecondTimer.name)
    secondTimerModel: Model<SecondTimerDocument>,
  ) {
    super(secondTimerModel);
  }

  async findByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.paginate(
      { organizationId },
      { ...pagination, sort: { createdAt: -1 } },
    );
  }

  async findByFirstTimer(firstTimerId: string) {
    return this.model.find({ firstTimerId, isDeleted: { $ne: true } }).exec();
  }

  async findFirstTimerByPhone(
    organizationId: string,
    phone: string,
  ): Promise<string | null> {
    const ft = await this.model.db
      .collection('firsttimers')
      .findOne(
        { organizationId, phoneNumber: phone, isDeleted: { $ne: true } },
        { projection: { _id: 1 } },
      );
    return ft ? String(ft._id) : null;
  }

  async findExistingPhones(
    organizationId: string,
    phones: string[],
  ): Promise<string[]> {
    const docs = await this.model
      .find(
        { organizationId, phoneNumber: { $in: phones }, isDeleted: { $ne: true } },
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
}
