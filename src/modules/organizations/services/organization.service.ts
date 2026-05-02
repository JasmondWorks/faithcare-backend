import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as QRCode from 'qrcode';
import { BaseService } from 'src/core/services/base.service';
import { OrganizationDocument } from '../schemas/organization.schema';
import { OrganizationRepository } from '../repositories/organization.repository';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { User, UserDocument } from 'src/modules/users/schemas/user.schema';

@Injectable()
export class OrganizationService extends BaseService<OrganizationDocument> {
  constructor(
    private organizationRepository: OrganizationRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    // Mark the creating admin as onboarded with their org
    await this.userModel.findByIdAndUpdate(createdByUserId, {
      organizationId: orgId,
      isOrgCreator: true,
      isOnboarded: true,
    });

    return org;
  }

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

  findBySlug(slug: string) {
    return this.organizationRepository.searchBySlug(slug);
  }

  async getMyOrganization(organizationId: string) {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }
}
