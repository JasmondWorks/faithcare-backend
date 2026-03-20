import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /** Create org and automatically grant the creator OWNER membership */
  async createWithOwner(dto: CreateOrganizationDto, createdByUserId: string) {
    const slug = dto.slug ?? this.toSlug(dto.name);
    const slugTaken = await this.organizationRepository.findOne({ slug });
    if (slugTaken) throw new ConflictException(`Slug "${slug}" is already taken`);

    const org = await this.organizationRepository.create({
      ...dto,
      slug,
      createdBy: createdByUserId,
    });

    await this.membershipService.createOwnership(
      createdByUserId,
      (org._id as any).toString(),
      dto.organizationRole,
    );

    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.organizationRepository.findOne({ slug, isDeleted: false });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }
}
