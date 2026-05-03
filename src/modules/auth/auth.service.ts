import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Otp, OtpDocument } from './schemas/otp.schema';
import {
  Organization,
  OrganizationDocument,
} from '../organizations/schemas/organization.schema';
import { EmailService } from './services/email.service';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { Role } from 'src/core/enums/role.enum';
import { RequestUser } from 'src/core/types/request-user.interface';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { InvitationService } from './services/invitation.service';
import { InvitationStatus } from './enums/invitation-status.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    private invitationService: InvitationService,
  ) {}

  // ── Token helpers ──────────────────────────────────────────────

  private signTokens(user: UserDocument) {
    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
        ? String(user.organizationId)
        : undefined,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret') as string,
      expiresIn: this.config.get('jwt.accessExpiresIn'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: payload.sub },
      {
        secret: this.config.get<string>('jwt.refreshSecret') as string,
        expiresIn: this.config.get('jwt.refreshExpiresIn'),
      },
    );

    return { accessToken, refreshToken };
  }

  private userView(user: UserDocument) {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isAdminVerified: user.isAdminVerified,
      isOnboarded:
        user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN
          ? !!user.organizationId
          : user.isOnboarded,
      isInvited: user.isInvited,
      isOrgCreator: user.isOrgCreator,
      organizationId: user.organizationId ? String(user.organizationId) : null,
      pendingOrganizationId: user.pendingOrganizationId
        ? String(user.pendingOrganizationId)
        : null,
      createdAt: user.createdAt,
    };
  }

  // ── OTP helpers ────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async createAndSendOtp(
    email: string,
    type: 'email_verification' | 'password_reset',
  ) {
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.otpModel.deleteMany({ email, type, used: false });
    await this.otpModel.create({ email, hashedOtp, type, expiresAt });
    await this.emailService.sendOtp(email, otp, type);
  }

  // ── Auth flows ─────────────────────────────────────────────────

  private async register(dto: UserRegisterDto, role: Role) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Admins start unverified — they must submit an AdminApplication and get approved
    const isAdminVerified = role !== Role.ADMIN;

    const user = await this.userModel.create({
      name: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      role,
      isEmailVerified: false,
      isAdminVerified,
    });

    await this.createAndSendOtp(user.email, 'email_verification');

    return {
      success: true,
      message:
        'Registration successful. Check your email for the verification OTP.',
    };
  }

  async userRegister(dto: UserRegisterDto) {
    return this.register(dto, Role.USER);
  }

  async adminRegister(dto: UserRegisterDto) {
    return this.register(dto, Role.ADMIN);
  }

  /**
   * Unified login for all users.
   * The `role` in the response determines authorization level on the client:
   *   USER        → regular app user (registered via /auth/register/user)
   *   ADMIN       → organization admin (registered via /auth/register/admin)
   *   SUPER_ADMIN → full platform access (manually assigned)
   */
  async login(dto: UserLoginDto) {
    const user = await this.userModel.findOne({
      email: dto.email,
      isDeleted: false,
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      await this.createAndSendOtp(user.email, 'email_verification');
      throw new UnauthorizedException(
        'Email not verified. A new OTP has been sent to your email.',
      );
    }

    const { accessToken, refreshToken } = this.signTokens(user);

    // Admin pending approval: let them log in but flag the status for the frontend
    if (user.role === Role.ADMIN && !user.isAdminVerified) {
      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: 28800,
          user: this.userView(user),
          message:
            'Your account is pending verification by the organization administrator. ' +
            'You will be notified once approved.',
        },
      };
    }

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 28800,
        user: this.userView(user),
      },
    };
  }

  async refreshToken(token: string) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    const { accessToken } = this.signTokens(user);
    return {
      success: true,
      data: { accessToken, tokenType: 'Bearer', expiresIn: 28800 },
    };
  }

  // ── Google auth ────────────────────────────────────────────────

  async googleSignIn(idToken: string) {
    const clientId = this.config.get<string>('google.clientId');
    if (!clientId) {
      throw new BadRequestException(
        'Google sign-in is not configured on this server',
      );
    }

    const client = new OAuth2Client(clientId);
    let googlePayload: {
      email?: string;
      name?: string;
      email_verified?: boolean;
    };
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      googlePayload = ticket.getPayload() ?? {};
    } catch {
      throw new UnauthorizedException('Invalid or expired Google ID token');
    }

    const { email, name, email_verified } = googlePayload;
    if (!email)
      throw new UnauthorizedException('Google token is missing email claim');
    if (!email_verified)
      throw new UnauthorizedException('Google email is not verified');

    let isNewUser = false;
    let user = await this.userModel.findOne({ email, isDeleted: false });

    if (!user) {
      isNewUser = true;
      const unusablePassword = await bcrypt.hash(
        Math.random().toString(36) + Date.now(),
        12,
      );
      user = await this.userModel.create({
        name: name ?? email.split('@')[0],
        email,
        password: unusablePassword,
        role: Role.USER,
        isEmailVerified: true,
      });
    } else if (!user.isEmailVerified) {
      await this.userModel.findByIdAndUpdate(user._id, {
        isEmailVerified: true,
      });
      user.isEmailVerified = true;
    }

    const { accessToken, refreshToken } = this.signTokens(user);
    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 28800,
        isNewUser,
        user: this.userView(user),
      },
    };
  }

  // ── Password reset ─────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email, isDeleted: false });
    // Always return success — do not reveal whether the email exists
    if (user) {
      await this.createAndSendOtp(email, 'password_reset');
    }
    return {
      success: true,
      message:
        'If that email is registered, a password reset code has been sent.',
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const record = await this.otpModel.findOne({
      email,
      type: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) throw new BadRequestException('OTP is invalid or has expired');

    const isMatch = await bcrypt.compare(otp, record.hashedOtp);
    if (!isMatch)
      throw new BadRequestException('OTP is invalid or has expired');

    await this.otpModel.findByIdAndUpdate(record._id, { used: true });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const user = await this.userModel.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');

    return {
      success: true,
      message: 'Password reset successfully. You can now log in.',
    };
  }

  // ── OTP verification ───────────────────────────────────────────

  async verifyEmailOtp(dto: VerifyOtpDto) {
    const record = await this.otpModel.findOne({
      email: dto.email,
      type: 'email_verification',
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) throw new BadRequestException('OTP is invalid or has expired');

    const isMatch = await bcrypt.compare(dto.otp, record.hashedOtp);
    if (!isMatch)
      throw new BadRequestException('OTP is invalid or has expired');

    await this.otpModel.findByIdAndUpdate(record._id, { used: true });

    const user = await this.userModel.findOneAndUpdate(
      { email: dto.email },
      { isEmailVerified: true },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');

    await this.emailService.sendWelcome(user.email, user.name);

    const { accessToken, refreshToken } = this.signTokens(user);
    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 2592000,
        user: this.userView(user),
      },
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    if (dto.type === 'email_verification') {
      const user = await this.userModel.findOne({ email: dto.email });
      if (!user) throw new NotFoundException('User not found');
    }
    await this.createAndSendOtp(dto.email, dto.type);
    return { success: true, message: 'OTP sent. Check your email.' };
  }

  // ── Admin invite ──────────────────────────────────────────────

  async inviteAdmin(inviter: RequestUser, dto: InviteAdminDto) {
    if (inviter.role !== Role.SUPER_ADMIN && inviter.role !== Role.ADMIN) {
      throw new BadRequestException('Not authorized to invite admins');
    }
    if (inviter.role === Role.ADMIN && !inviter.organizationId) {
      throw new BadRequestException(
        'You must belong to an organization before inviting other admins',
      );
    }

    // Only block if an account that has already been ACCEPTED exists.
    const existing = await this.userModel.findOne({
      email: dto.email,
      isDeleted: false,
    });
    if (existing) throw new ConflictException('Email already registered');

    // Resolve the inviting org's display name for the email body.
    let orgName = 'FaithCare';
    if (inviter.organizationId) {
      const org = await this.orgModel.findById(inviter.organizationId);
      orgName = org?.name ?? 'FaithCare';
    }

    const expiresIn = this.config.get<string>('jwt.inviteExpiresIn') ?? '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default to 7 days for tracking

    // Create a DB record for tracking
    await this.invitationService.create({
      email: dto.email,
      fullName: dto.fullName,
      organizationId: inviter.organizationId ?? null,
      invitedBy: inviter.id,
      expiresAt,
    });

    const inviteToken = this.jwtService.sign(
      {
        sub: dto.email,
        name: dto.fullName,
        type: 'admin_invite',
        organizationId: inviter.organizationId ?? null,
        orgName,
      },
      {
        secret: this.config.get<string>('jwt.inviteSecret') as string,
        expiresIn: expiresIn as any,
      },
    );

    const platformUrl = this.config.get<string>('platformUrl');
    const inviteLink = `${platformUrl}/auth/accept-invite?token=${inviteToken}`;

    await this.emailService.sendAdminInvite(
      dto.email,
      dto.fullName,
      inviteLink,
      expiresIn,
      orgName,
    );

    return { success: true, message: `Invitation sent to ${dto.email}` };
  }

  // ── Invite token helpers ──────────────────────────────────────

  private decodeInviteToken(token: string): {
    sub: string;
    name: string;
    type: string;
    organizationId: string | null;
    orgName: string;
  } {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.inviteSecret') as string,
      });
      if (payload.type !== 'admin_invite') {
        throw new Error();
      }
      return payload;
    } catch {
      throw new BadRequestException(
        'Invitation link is invalid or has expired. Please ask to be re-invited.',
      );
    }
  }

  /**
   * Validates the invite token without consuming it.
   * Returns name, email, and orgName from the JWT payload so the frontend
   * can personalise the set-password page before calling acceptInvite.
   */
  async verifyInvite(token: string) {
    const payload = this.decodeInviteToken(token);

    // If the user already exists the invite was already accepted.
    const accepted = await this.userModel.findOne({
      email: payload.sub,
      isDeleted: false,
    });
    if (accepted) {
      throw new ConflictException(
        'This invitation has already been accepted. Please log in.',
      );
    }

    return {
      success: true,
      data: { name: payload.name, email: payload.sub, orgName: payload.orgName },
    };
  }

  /**
   * Creates the admin account and sets their chosen password in one step.
   * Returns a full auth response so the frontend can log the user in
   * immediately — no separate login step required.
   */
  async acceptInvite(token: string, password: string) {
    const payload = this.decodeInviteToken(token);

    const accepted = await this.userModel.findOne({
      email: payload.sub,
      isDeleted: false,
    });
    if (accepted) {
      throw new ConflictException(
        'This invitation has already been accepted. Please log in.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await this.userModel.create({
      name: payload.name,
      email: payload.sub,
      password: hashedPassword,
      role: Role.ADMIN,
      organizationId: payload.organizationId ?? null,
      isEmailVerified: true,
      isAdminVerified: true,
      isInvited: false,
      isOnboarded: !!payload.organizationId,
    });

    // Mark invitation as accepted in DB
    const invite = await this.invitationService.findByEmail(payload.sub);
    if (invite) {
      await this.invitationService.markAsAccepted(String(invite._id));
    }

    const { accessToken, refreshToken } = this.signTokens(user);
    return {
      success: true,
      message: 'Password set successfully. Welcome to FaithCare!',
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 28800,
        user: this.userView(user),
      },
    };
  }

  async getInvitationsByOrg(organizationId: string) {
    const data = await this.invitationService.findByOrganization(organizationId);
    return { success: true, data };
  }
}
