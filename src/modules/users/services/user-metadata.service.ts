import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

  /**
   * Connect (or update) a user's church affiliation.
   * Provide `organization` (ObjectId) for an existing org, or `churchName` for a custom entry.
   */
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
}
