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
  ) {}

  // ── Token helpers ──────────────────────────────────────────────

  private signTokens(user: UserDocument) {
    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
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
      isInvited: user.isInvited,
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

    // For verified admins, tell the frontend if they're the org creator
    let adminOrgContext:
      | { organizationId: string; isCreator: boolean }
      | undefined;
    if (user.role === Role.ADMIN && user.isAdminVerified) {
      const ownedOrg = await this.orgModel.findOne({
        createdBy: String(user._id),
        isDeleted: false,
      });
      adminOrgContext = {
        organizationId: ownedOrg ? String(ownedOrg._id) : '',
        isCreator: !!ownedOrg,
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
        ...(adminOrgContext ?? {}),
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

  // ── Super admin invite ─────────────────────────────────────────

  async inviteAdmin(
    inviterRole: string,
    dto: { fullName: string; email: string },
  ) {
    if ((inviterRole as Role) !== Role.SUPER_ADMIN) {
      throw new BadRequestException('Only SUPER_ADMIN can invite admins');
    }

    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    const tempPassword =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-4).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await this.userModel.create({
      name: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      role: Role.ADMIN,
      isEmailVerified: true,
      isAdminVerified: true,
      isInvited: true,
    });

    await this.emailService.sendAdminInvite(
      dto.email,
      dto.fullName,
      tempPassword,
    );

    return { success: true, message: `Invite sent to ${dto.email}` };
  }

  async changePasswordForInvited(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword, isInvited: false },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return { success: true, message: 'Password updated successfully.' };
  }
}
