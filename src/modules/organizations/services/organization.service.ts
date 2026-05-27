import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BaseService } from 'src/core/services/base.service';
import { OrganizationDocument } from '../schemas/organization.schema';
import { OrganizationRepository } from '../repositories/organization.repository';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { User, UserDocument } from 'src/modules/users/schemas/user.schema';
import { Role } from 'src/core/enums/role.enum';

@Injectable()
export class OrganizationService extends BaseService<OrganizationDocument> {
  constructor(
    private organizationRepository: OrganizationRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {
    super(organizationRepository);
  }

  private async generateFirstTimerQrCode(
    orgId: string,
    slug: string,
    orgName: string,
  ): Promise<string> {
    const platformUrl =
      this.config.get<string>('platformUrl') ??
      'https://faithcare-web.vercel.app';

    // Sign a short-lived token so the URL is opaque and time-gated.
    // The QR code must be regenerated before each service — once expired,
    // forwarded URLs and screenshots no longer work.
    const token = this.jwtService.sign(
      { sub: orgId, slug, name: orgName, type: 'qr_registration' },
      {
        secret: this.config.get<string>('jwt.qrSecret') as string,
        expiresIn: (this.config.get<string>('jwt.qrExpiresIn') ?? '8h') as any,
      },
    );

    const url = `${platformUrl}/register?token=${token}`;
    return QRCode.toDataURL(url, { errorCorrectionLevel: 'M', width: 400 });
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

    const firstTimerQrCode = await this.generateFirstTimerQrCode(orgId, slug, dto.name);
    await this.organizationRepository.update(orgId, { firstTimerQrCode });
    org.firstTimerQrCode = firstTimerQrCode;

    // Mark the creating admin as onboarded with their org
    await this.userModel.findByIdAndUpdate(createdByUserId, {
      organizationId: orgId,
      organizationRole: dto.organizationRole,
      role: Role.ADMIN,
      isOrgCreator: true,
      isOnboarded: true,
    });

    return org;
  }

  async regenerateQrCode(orgId: string) {
    const org = await this.organizationRepository.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const firstTimerQrCode = await this.generateFirstTimerQrCode(orgId, org.slug, org.name);
    await this.organizationRepository.update(orgId, { firstTimerQrCode });
    return { firstTimerQrCode };
  }

  findBySlug(slug: string) {
    return this.organizationRepository.searchBySlug(slug);
  }

  async getMyOrganization(organizationId: string | undefined, userId: string) {
    let id = organizationId;

    // Fallback: if JWT is stale (e.g. right after onboarding), check the database
    if (!id || id === 'null' || id === 'undefined') {
      const user = await this.userModel.findById(userId).exec();
      id = user?.organizationId?.toString();
    }

    if (!id || id === 'null' || id === 'undefined') return null;

    return this.organizationRepository.findById(id);
  }
}
