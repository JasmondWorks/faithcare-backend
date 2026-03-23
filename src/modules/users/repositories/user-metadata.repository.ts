import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { UserMetaData, UserMetaDataDocument } from '../schemas/user-metadata.schema';

@Injectable()
export class UserMetaDataRepository extends BaseRepository<UserMetaDataDocument> {
  constructor(
    @InjectModel(UserMetaData.name)
    userMetaDataModel: Model<UserMetaDataDocument>,
  ) {
    super(userMetaDataModel);
  }

  async findByUserId(userId: string) {
    return this.model
      .findOne({ userId, isDeleted: false })
      .populate('church.organizationId', 'name slug email city state denomination phoneNumber')
      .exec();
  }
}
