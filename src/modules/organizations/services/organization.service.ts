import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { BaseService } from 'src/core/services/base.service';
import { OrganizationDocument } from '../schemas/organization.schema';
import { OrganizationRepository } from '../repositories/organization.repository';
import { MembershipService } from './membership.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';

@Injectable()
export class OrganizationService extends BaseService<OrganizationDocument> {
  constructor(
    private organizationRepository: OrganizationRepository,
    private membershipService: MembershipService,
  ) {
    super(organizationRepository);
  }

  private async generateFirstTimerQrCode(
    orgId: string,
    slug: string,
    name: string,
  ): Promise<string> {
    const payload = JSON.stringify({ organizationId: orgId, slug, name });
    return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', width: 400 });
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /** Create org, generate its first-timer QR code, and grant the creator OWNER membership */
  async createWithOwner(dto: CreateOrganizationDto, createdByUserId: string) {
    const slug = dto.slug ?? this.toSlug(dto.name);
    const slugTaken = await this.organizationRepository.findOne({ slug });
    if (slugTaken)
      throw new ConflictException(`Slug "${slug}" is already taken`);

    const org = await this.organizationRepository.create({
      ...dto,
      slug,
      createdBy: createdByUserId,
    });

    const orgId = String(org._id);

    const firstTimerQrCode = await this.generateFirstTimerQrCode(
      orgId,
      slug,
      dto.name,
    );
    await this.organizationRepository.update(orgId, { firstTimerQrCode });
    org.firstTimerQrCode = firstTimerQrCode;

    await this.membershipService.createOwnership(
      createdByUserId,
      orgId,
      dto.organizationRole,
    );

    return org;
  }

  /** Regenerate the first-timer QR code for an existing org (e.g. after a name/slug change) */
  async regenerateQrCode(orgId: string) {
    const org = await this.organizationRepository.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const firstTimerQrCode = await this.generateFirstTimerQrCode(
      orgId,
      org.slug,
      org.name,
    );
    await this.organizationRepository.update(orgId, { firstTimerQrCode });
    return { firstTimerQrCode };
  }

  async findBySlug(slug: string) {
    const org = await this.organizationRepository.findOne({
      slug,
      isDeleted: false,
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }
}
