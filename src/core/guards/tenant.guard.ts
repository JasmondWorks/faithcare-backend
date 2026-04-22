import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { MembershipService } from 'src/modules/organizations/services/membership.service';

/**
 * Protects routes scoped to a specific organization.
 *
 * Requires the caller to have previously exchanged their global token for an
 * org-scoped token via POST /auth/switch-organization/:organizationId.
 *
 * Checks:
 *  1. JWT contains activeOrganizationId (i.e. caller has switched into an org)
 *  2. activeOrganizationId matches the :organizationId route param
 *  3. Caller still has an ACTIVE membership in that org (guards against stale tokens)
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly membershipService: MembershipService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user?.activeOrganizationId) {
      throw new ForbiddenException(
        'No organization context. Call POST /auth/switch-organization/:organizationId first.',
      );
    }

    const routeOrgId =
      (request.params as Record<string, string>)?.organizationId ?? '';

    if (routeOrgId && user.activeOrganizationId !== routeOrgId) {
      throw new ForbiddenException(
        'Token organization context does not match the requested organization.',
      );
    }

    // Re-verify membership is still active (catches revoked/suspended memberships)
    const membership = await this.membershipService.findActiveMembership(
      user.id,
      user.activeOrganizationId,
    );

    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this organization.',
      );
    }

    return true;
  }
}
