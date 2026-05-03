import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { InvitationDocument } from '../schemas/invitation.schema';
import { InvitationRepository } from '../repositories/invitation.repository';
import { InvitationStatus } from '../enums/invitation-status.enum';

@Injectable()
export class InvitationService extends BaseService<InvitationDocument> {
  constructor(private invitationRepository: InvitationRepository) {
    super(invitationRepository);
  }

  async findByEmail(email: string) {
    return this.invitationRepository.findByEmail(email);
  }

  async findByOrganization(organizationId: string) {
    return this.invitationRepository.findByOrganization(organizationId);
  }

  async markAsAccepted(id: string) {
    return this.invitationRepository.update(id, { status: InvitationStatus.ACCEPTED });
  }

  async markAsExpired(id: string) {
    return this.invitationRepository.update(id, { status: InvitationStatus.EXPIRED });
  }
}
