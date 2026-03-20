import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { UserMetaDataDocument } from '../schemas/user-metadata.schema';
import { UserMetaDataRepository } from '../repositories/user-metadata.repository';

@Injectable()
export class UserMetaDataService extends BaseService<UserMetaDataDocument> {
  constructor(private userMetaDataRepository: UserMetaDataRepository) {
    super(userMetaDataRepository);
  }

  async findByUserId(userId: string) {
    return this.userMetaDataRepository.findByUserId(userId);
  }
}
