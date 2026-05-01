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

  findByOrganization(organizationId: string) {
    return this.model
      .find({ organizationId, isDeleted: false })
      .sort({ name: 1 })
      .exec();
  }

  searchByName(organizationId: string, query: string) {
    return this.model
      .find({
        organizationId,
        isDeleted: false,
        name: { $regex: query, $options: 'i' },
      })
      .limit(20)
      .exec();
  }
}
