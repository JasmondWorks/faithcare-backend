import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, CookieOptions } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from 'src/core/decorators/public.decorator';
import { AuthService } from './auth.service';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { VerifyInviteDto } from './dto/verify-invite.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

const REFRESH_COOKIE = 'refresh_token';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/user')
  @ApiOperation({ summary: 'Register a new user account (role: USER)' })
  @ApiResponse({
    status: 201,
    description: 'Account created — verify your email to log in',
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  userRegister(@Body() userRegisterDto: UserRegisterDto) {
    return this.authService.userRegister(userRegisterDto);
  }

  @Public()
  @Post('register/admin')
  @ApiOperation({ summary: 'Register a new admin account (role: ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Account created — verify your email to log in',
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  adminRegister(@Body() userRegisterDto: UserRegisterDto) {
    return this.authService.adminRegister(userRegisterDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in with email and password',
    description:
      'Returns both tokens. The backend also sets the refresh token as an HttpOnly cookie ' +
      'for pure React clients. Next.js apps should read refreshToken from the body and store ' +
      'it via a server route handler for a same-site cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful — refreshToken in body and cookie',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or email not verified',
  })
  async login(
    @Body() loginDto: UserLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    res.cookie(REFRESH_COOKIE, result.data.refreshToken, COOKIE_OPTIONS);
    return result;
  }

  @Public()
  @Post('google/signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with Google (client-side flow)',
    description:
      'The frontend uses the Google Identity Services SDK to obtain an id_token, then POSTs it here. ' +
      'Creates a new USER account on first sign-in. Returns the same JWT payload as regular login.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sign-in successful — isNewUser: true on first sign-in',
  })
  @ApiResponse({
    status: 400,
    description: 'Google sign-in not configured on this server',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired Google ID token',
  })
  async googleSignIn(
    @Body() dto: GoogleSignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleSignIn(dto.idToken);
    res.cookie(REFRESH_COOKIE, result.data.refreshToken, COOKIE_OPTIONS);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a refresh token for a new access token',
    description:
      'Accepts the refresh token from the request body OR the refresh_token HttpOnly cookie. ' +
      'Body takes precedence.',
  })
  @ApiResponse({ status: 200, description: 'New access_token returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid refresh token' })
  @ApiResponse({ status: 403, description: 'Request origin not allowed' })
  refreshToken(@Req() req: Request, @Body() body: RefreshTokenDto) {
    const origin = req.headers['origin'];
    if (
      origin &&
      ALLOWED_ORIGINS.length > 0 &&
      !ALLOWED_ORIGINS.includes(origin)
    ) {
      throw new ForbiddenException('Request origin not allowed');
    }
    const cookieToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const token = body?.refreshToken ?? cookieToken;
    if (!token) throw new UnauthorizedException('No refresh token');
    return this.authService.refreshToken(token);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with OTP code sent during registration',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified — refreshToken in body and cookie',
  })
  @ApiResponse({ status: 400, description: 'OTP is invalid or has expired' })
  async verifyEmailOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmailOtp(verifyOtpDto);
    res.cookie(REFRESH_COOKIE, result.data.refreshToken, COOKIE_OPTIONS);
    return result;
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP for email verification or password reset',
  })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset OTP',
    description:
      'Sends a 6-digit OTP to the provided email address. Always returns success to prevent ' +
      'user enumeration — the email is only sent if the address is registered.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent (if email is registered)',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using OTP',
    description:
      'Verifies the OTP sent to the email address and sets a new password. OTP expires in 10 minutes.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'OTP is invalid or has expired' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @ApiBearerAuth('access-token')
  @Post('invite-admin')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({
    summary: 'Invite a new admin (SUPER_ADMIN or org ADMIN)',
    description:
      'Creates an ADMIN account with no usable password and sends an invitation link to the provided email. ' +
      'The invited admin follows the link to `POST /auth/invite/accept` where they set their own password. ' +
      'SUPER_ADMIN invites are platform-wide; org ADMINs can invite into their own organization.',
  })
  @ApiResponse({ status: 201, description: 'Invitation email sent' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  inviteAdmin(@Body() dto: InviteAdminDto, @CurrentUser() user: RequestUser) {
    return this.authService.inviteAdmin(user, dto);
  }

  @Public()
  @Post('invite/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate an invitation token before showing the set-password page',
    description:
      'Called immediately after the invited admin clicks the email link. ' +
      'Checks that the token is still valid and the invitation has not already been used. ' +
      'On success, returns the admin\'s `name` and `email` so the frontend can personalise ' +
      'the set-password form. If this call succeeds, redirect to the set-password page and ' +
      'call `POST /auth/invite/accept` with the same token once the admin submits.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid — { name, email } returned',
  })
  @ApiResponse({ status: 400, description: 'Token is invalid or has expired' })
  @ApiResponse({ status: 404, description: 'Invitation already used or not found' })
  verifyInvite(@Body() dto: VerifyInviteDto) {
    return this.authService.verifyInvite(dto.token);
  }

  @Public()
  @Post('invite/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept an invitation and set a password',
    description:
      'Called from the invitation link sent to the admin\'s email. ' +
      'Verifies the invite token, sets the chosen password, and returns a full auth response ' +
      'so the frontend can log the user in immediately — no separate login step required. ' +
      'The token expires 7 days after the invitation was sent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password set — access and refresh tokens returned',
  })
  @ApiResponse({
    status: 400,
    description: 'Invitation link is invalid or has expired',
  })
  @ApiResponse({ status: 404, description: 'Invitation already used or not found' })
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.acceptInvite(dto.token, dto.password);
    res.cookie(REFRESH_COOKIE, result.data.refreshToken, COOKIE_OPTIONS);
    return result;
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log out — clears the refresh token cookie',
    description:
      'Clears the HttpOnly refresh_token cookie. The access token expires naturally; clients should discard it locally.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    return { success: true, message: 'Logged out successfully' };
  }
}
