import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from 'src/core/services/base.service';
import { UserMetaDataDocument } from '../schemas/user-metadata.schema';
import { UserMetaDataRepository } from '../repositories/user-metadata.repository';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserMetaDataService extends BaseService<UserMetaDataDocument> {
  constructor(
    private userMetaDataRepository: UserMetaDataRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super(userMetaDataRepository);
  }

  /** Creates metadata and marks the user as onboarded. */
  async create(data: any): Promise<UserMetaDataDocument> {
    const record = await super.create(data);
    if (data.userId) {
      await this.userModel.findByIdAndUpdate(data.userId, {
        isOnboarded: true,
      });
    }
    return record;
  }

  async findByUserId(userId: string) {
    return this.userMetaDataRepository.findByUserId(userId);
  }

  async connectToChurch(
    userId: string,
    dto: { organization?: string | null; churchName?: string | null },
  ) {
    if (!dto.organization && !dto.churchName) {
      throw new BadRequestException(
        'Provide either organization or churchName',
      );
    }
    if (dto.organization && dto.churchName) {
      throw new BadRequestException(
        'Provide only one of organization or churchName, not both',
      );
    }

    const metadata = await this.userMetaDataRepository.findByUserId(userId);
    if (!metadata) throw new NotFoundException('User metadata not found');

    const update = dto.organization
      ? { organization: dto.organization, churchName: null }
      : { organization: null, churchName: dto.churchName };

    await this.userMetaDataRepository.update(String(metadata._id), update);
    return this.userMetaDataRepository.findByUserId(userId);
  }
  async delete(id: string): Promise<boolean> {
    const metadata = await this.userMetaDataRepository.findById(id);
    if (metadata && metadata.userId) {
      await this.userModel.findByIdAndUpdate(metadata.userId, {
        isOnboarded: false,
      });
    }
    return super.delete(id);
  }
}
