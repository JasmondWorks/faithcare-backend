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
import { User, UserDocument } from '../users/schemas/user.schema';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { EmailService } from './services/email.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { Role } from 'src/core/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  // ── Token helpers ──────────────────────────────────────────────

  private signTokens(user: UserDocument) {
    const payload = {
      sub: (user._id as any).toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      organizationRole: user.organizationRole,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret') as string,
      expiresIn: this.config.get('jwt.accessExpiresIn') as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: payload.sub },
      {
        secret: this.config.get<string>('jwt.refreshSecret') as string,
        expiresIn: this.config.get('jwt.refreshExpiresIn') as any,
      },
    );

    return { accessToken, refreshToken };
  }

  private userView(user: UserDocument) {
    return {
      id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: (user as any).isEmailVerified ?? false,
      createdAt: (user as any).createdAt,
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

  async adminLogin(dto: AdminLoginDto) {
    const user = await this.userModel.findOne({
      email: dto.email,
      isDeleted: false,
      role: { $in: [Role.ADMIN, Role.ORGANIZATION_ADMIN, Role.SUPER_ADMIN] },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken } = this.signTokens(user);
    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 28800,
        admin: this.userView(user),
      },
    };
  }

  async userRegister(dto: UserRegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.userModel.create({
      name: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      role: Role.USER,
      isEmailVerified: false,
    });

    await this.createAndSendOtp(user.email, 'email_verification');

    return {
      success: true,
      message: 'Registration successful. Check your email for the verification OTP.',
    };
  }

  async userLogin(dto: UserLoginDto) {
    const user = await this.userModel.findOne({ email: dto.email, isDeleted: false });
    if (!user) throw new UnauthorizedException('User with this email was not found');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      await this.createAndSendOtp(user.email, 'email_verification');
      throw new UnauthorizedException(
        'Email not verified. A new OTP has been sent to your email.',
      );
    }

    const { accessToken, refreshToken } = this.signTokens(user);
    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 2592000,
        user: this.userView(user),
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    const { accessToken } = this.signTokens(user);
    return { success: true, data: { accessToken, tokenType: 'Bearer', expiresIn: 28800 } };
  }

  async googleAuth() {
    return { message: 'Redirecting to Google OAuth' };
  }

  async googleCallback(code: string, _state: string) {
    // TODO: exchange code with Google, upsert user, return tokens
    return { message: 'Google OAuth — implementation requires Google credentials' };
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
    if (!isMatch) throw new BadRequestException('OTP is invalid or has expired');

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
}
