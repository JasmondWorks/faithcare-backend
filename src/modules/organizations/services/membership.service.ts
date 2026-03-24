import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MembershipRepository } from '../repositories/membership.repository';
import { User, UserDocument } from 'src/modules/users/schemas/user.schema';
import { MembershipRole } from 'src/core/enums/membership-role.enum';
import { MembershipStatus } from 'src/core/enums/membership-status.enum';
import { OrganizationRole } from 'src/core/enums/organization-role.enum';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';

@Injectable()
export class MembershipService {
  constructor(
    private readonly membershipRepo: MembershipRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /** All active orgs a user belongs to */
  getUserOrganizations(userId: string) {
    return this.membershipRepo.findByUser(userId);
  }

  /** All active members of an org */
  getOrganizationMembers(organizationId: string) {
    return this.membershipRepo.findByOrganization(organizationId);
  }

  /** Create OWNER membership when user creates an org */
  async createOwnership(userId: string, organizationId: string, organizationRole: OrganizationRole) {
    return this.membershipRepo.create({
      userId,
      organization: organizationId,
      role: MembershipRole.OWNER,
      status: MembershipStatus.ACTIVE,
      organizationRole,
      invitedBy: null,
    });
  }

  /** Invite an existing user to an org by email */
  async inviteMember(
    organizationId: string,
    invitedByUserId: string,
    dto: InviteMemberDto,
  ) {
    const targetUser = await this.userModel.findOne({ email: dto.email, isDeleted: false });
    if (!targetUser) throw new NotFoundException('No user found with that email');

    const targetId = (targetUser._id as any).toString();
    const existing = await this.membershipRepo.findByUserAndOrg(targetId, organizationId);

    if (existing && existing.status === MembershipStatus.ACTIVE) {
      throw new ConflictException('User is already a member of this organization');
    }

    // Re-activate if previously suspended
    if (existing) {
      return this.membershipRepo.update((existing._id as any).toString(), {
        role: dto.role ?? MembershipRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        invitedBy: invitedByUserId,
      });
    }

    return this.membershipRepo.create({
      userId: targetId,
      organization: organizationId,
      role: dto.role ?? MembershipRole.MEMBER,
      status: MembershipStatus.ACTIVE,
      invitedBy: invitedByUserId,
    });
  }

  /** Update a member's role — only OWNER can assign ADMIN; only OWNER can transfer ownership */
  async updateMemberRole(
    organizationId: string,
    actorUserId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const actorMembership = await this.membershipRepo.findActiveMembership(
      actorUserId,
      organizationId,
    );
    if (!actorMembership) throw new ForbiddenException('Access denied');

    if (
      actorMembership.role === MembershipRole.MEMBER ||
      (dto.role === MembershipRole.OWNER && actorMembership.role !== MembershipRole.OWNER)
    ) {
      throw new ForbiddenException('Insufficient permissions to assign this role');
    }

    const targetMembership = await this.membershipRepo.findActiveMembership(
      targetUserId,
      organizationId,
    );
    if (!targetMembership) throw new NotFoundException('Member not found in this organization');

    return this.membershipRepo.update((targetMembership._id as any).toString(), {
      role: dto.role,
    });
  }

  /** Remove a member — OWNERs cannot be removed; only ADMIN+ can remove others */
  async removeMember(
    organizationId: string,
    actorUserId: string,
    targetUserId: string,
  ) {
    if (actorUserId === targetUserId) {
      throw new ForbiddenException('Use /leave to leave an organization');
    }

    const actorMembership = await this.membershipRepo.findActiveMembership(
      actorUserId,
      organizationId,
    );
    if (!actorMembership || actorMembership.role === MembershipRole.MEMBER) {
      throw new ForbiddenException('Access denied');
    }

    const targetMembership = await this.membershipRepo.findActiveMembership(
      targetUserId,
      organizationId,
    );
    if (!targetMembership) throw new NotFoundException('Member not found');
    if (targetMembership.role === MembershipRole.OWNER) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    return this.membershipRepo.delete((targetMembership._id as any).toString());
  }

  /** Leave an organization — OWNER must transfer ownership first */
  async leaveOrganization(userId: string, organizationId: string) {
    const membership = await this.membershipRepo.findActiveMembership(userId, organizationId);
    if (!membership) throw new NotFoundException('You are not a member of this organization');
    if (membership.role === MembershipRole.OWNER) {
      throw new ForbiddenException(
        'Transfer ownership to another member before leaving',
      );
    }
    return this.membershipRepo.delete((membership._id as any).toString());
  }

  /** Used by AuthService and TenantGuard to verify access */
  findActiveMembership(userId: string, organizationId: string) {
    return this.membershipRepo.findActiveMembership(userId, organizationId);
  }
}
