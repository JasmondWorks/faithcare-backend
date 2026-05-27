import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { Member, MemberDocument } from '../schemas/member.schema';

@Injectable()
export class MemberRepository extends BaseRepository<MemberDocument> {
  constructor(@InjectModel(Member.name) model: Model<MemberDocument>) {
    super(model);
  }

  findByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    return this.paginate({ organizationId }, { ...pagination, sort: { name: 1 } });
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

  searchByName(organizationId: string, query: string) {
    return this.model
      .find({
        organizationId,
        isDeleted: { $ne: true },
        name: { $regex: query, $options: 'i' },
      })
      .limit(20)
      .exec();
  }
}
