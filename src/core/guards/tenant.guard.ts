import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { OrganizationService } from 'src/modules/organizations/services/organization.service';
import { Role } from 'src/core/enums/role.enum';

/**
 * Protects org-scoped admin routes.
 * Verifies the requesting ADMIN created the organization.
 * SUPER_ADMIN bypasses the ownership check and can access any org.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly organizationService: OrganizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) throw new ForbiddenException('Authentication required');

    const orgId = (request.params as Record<string, string>)?.organizationId;
    if (!orgId) return true;

    if ((user.role as Role) === Role.SUPER_ADMIN) return true;

    const org = await this.organizationService.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const createdBy = String((org as any).createdBy ?? '');
    if (createdBy !== user.id) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    return true;
  }
}
