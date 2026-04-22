/**
 * Shape of request.user set by JwtStrategy.validate().
 * Matches the object returned from the JWT access-token payload.
 */
export interface RequestUser {
  id: string;
  email: string;
  role: string;
  activeOrganizationId?: string;
  activeOrganizationRole?: string;
}
