import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/core/repositories/base.repository';
import { UserDocument } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class UsersRepository extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name)
    userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }
}
