import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/modules/users/schemas/user.schema';
import {
  Organization,
  OrganizationDocument,
} from 'src/modules/organizations/schemas/organization.schema';
import { AdminApplicationRepository } from '../repositories/admin-application.repository';
import { Role } from 'src/core/enums/role.enum';

const APPROVAL_EXPIRY_DAYS = 30;

@Injectable()
export class AdminApplicationService {
  constructor(
    private readonly appRepo: AdminApplicationRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
  ) {}

  /** Admin submits an application to join an org. */
  async apply(applicantId: string, organizationId: string) {
    const user = await this.userModel.findById(applicantId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== Role.ADMIN)
      throw new ForbiddenException(
        'Only ADMIN accounts can submit applications',
      );
    if (user.isAdminVerified)
      throw new BadRequestException('Your account is already verified');

    const org = await this.orgModel.findById(organizationId);
    if (!org || (org as any).isDeleted)
      throw new NotFoundException('Organization not found');

    const existing = await this.appRepo.findByApplicant(applicantId);
    if (existing && (existing as any).status === 'PENDING') {
      throw new ConflictException('You already have a pending application');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + APPROVAL_EXPIRY_DAYS);

    const application = await this.appRepo.create({
      applicantId,
      organizationId,
      expiresAt,
    });

    await this.userModel.findByIdAndUpdate(applicantId, {
      pendingOrganizationId: organizationId,
    });

    return application;
  }

  /** Get the current application for the authenticated admin. */
  getMyApplication(applicantId: string) {
    return this.appRepo.findByApplicant(applicantId);
  }

  /** List pending applications for an organization (creator or super_admin). */
  async listForOrganization(
    organizationId: string,
    requesterId: string,
    requesterRole: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    if ((requesterRole as Role) !== Role.SUPER_ADMIN) {
      const org = await this.orgModel.findById(organizationId);
      if (!org || String((org as any).createdBy) !== requesterId) {
        throw new ForbiddenException(
          'Only the organization creator or SUPER_ADMIN can view applications',
        );
      }
    }
    return this.appRepo.findByOrganization(organizationId, pagination);
  }

  /**
   * Approve an application.
   * Grants approval if:
   *  - Approver is the organization creator, OR
   *  - At least 2 verified admins have now approved
   */
  async approve(
    applicationId: string,
    approverId: string,
    approverRole: string,
  ) {
    const application = await this.appRepo.findById(applicationId);
    if (!application) throw new NotFoundException('Application not found');
    if ((application as any).status !== 'PENDING')
      throw new BadRequestException('Application is no longer pending');

    const app = application as any;
    const alreadyApproved = app.approvals.some(
      (a: any) => String(a.adminId) === approverId,
    );
    if (alreadyApproved)
      throw new ConflictException('You have already approved this application');

    const org = await this.orgModel.findById(app.organizationId);
    const isCreator = org && String((org as any).createdBy) === approverId;
    const isSuperAdmin = (approverRole as Role) === Role.SUPER_ADMIN;

    app.approvals.push({ adminId: approverId, approvedAt: new Date() });
    const totalApprovals = app.approvals.length;
    const shouldApprove = isCreator || isSuperAdmin || totalApprovals >= 2;

    await this.appRepo.update(applicationId, { approvals: app.approvals });

    if (shouldApprove) {
      await this.appRepo.update(applicationId, { status: 'APPROVED' });
      await this.userModel.findByIdAndUpdate(app.applicantId, {
        isAdminVerified: true,
        pendingOrganizationId: null,
        organizationId: app.organizationId,
        isOnboarded: true,
      });
      return {
        approved: true,
        message: 'Application approved. Admin account is now active.',
      };
    }

    return {
      approved: false,
      message: `Approval recorded (${totalApprovals}/2 required). Awaiting more approvals.`,
    };
  }

  /** Reject an application. Only org creator or super_admin. */
  async reject(
    applicationId: string,
    rejecterId: string,
    requesterRole: string,
    reason?: string,
  ) {
    const application = await this.appRepo.findById(applicationId);
    if (!application) throw new NotFoundException('Application not found');
    if ((application as any).status !== 'PENDING')
      throw new BadRequestException('Application is no longer pending');

    const app = application as any;
    if ((requesterRole as Role) !== Role.SUPER_ADMIN) {
      const org = await this.orgModel.findById(app.organizationId);
      if (!org || String((org as any).createdBy) !== rejecterId) {
        throw new ForbiddenException(
          'Only the organization creator or SUPER_ADMIN can reject applications',
        );
      }
    }

    await this.appRepo.update(applicationId, {
      status: 'REJECTED',
      rejectionReason: reason ?? null,
    });
    await this.userModel.findByIdAndUpdate(app.applicantId, {
      pendingOrganizationId: null,
    });

    return { message: 'Application rejected.' };
  }

  /** Called by the scheduler — delete expired accounts and applications. */
  async purgeExpired() {
    const expired = await this.appRepo.findExpiredPending();
    for (const app of expired) {
      await this.userModel.findByIdAndDelete((app as any).applicantId);
      await this.appRepo.update(String((app as any)._id), { isDeleted: true });
    }
    return expired.length;
  }
}
