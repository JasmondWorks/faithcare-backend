import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
   * Exactly one of organizationId or name must be provided.
   */
  async connectToChurch(
    userId: string,
    dto: { organizationId?: string | null; name?: string | null },
  ) {
    if (!dto.organizationId && !dto.name) {
      throw new BadRequestException('Provide either organizationId or name');
    }
    if (dto.organizationId && dto.name) {
      throw new BadRequestException('Provide only one of organizationId or name, not both');
    }

    const metadata = await this.userMetaDataRepository.findByUserId(userId);
    if (!metadata) throw new NotFoundException('User metadata not found');

    const church = dto.organizationId
      ? { organizationId: dto.organizationId, name: null }
      : { organizationId: null, name: dto.name as string };

    await this.userMetaDataRepository.update((metadata._id as any).toString(), { church });
    return this.userMetaDataRepository.findByUserId(userId);
  }
}
