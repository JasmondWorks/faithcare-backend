import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
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
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Public } from 'src/core/decorators/public.decorator';
import { AuthService } from './auth.service';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

const REFRESH_COOKIE = 'refresh_token';

// Origins allowed to call the refresh endpoint (CSRF mitigation).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Cookie is set on the backend as a convenience for pure browser/React clients.
// Next.js apps should read the refreshToken from the response body and set their
// own first-party HttpOnly cookie via a server route handler.
const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction, // 👈 false in dev
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
      '(SameSite=None) for pure React clients. Next.js apps should read refreshToken from ' +
      'the body and store it via a server route handler for a same-site cookie.',
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
  @Get('google')
  @ApiOperation({
    summary:
      'Initiate Google OAuth 2.0 flow — redirects to Google consent screen',
  })
  googleAuth() {
    return this.authService.googleAuth();
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({
    summary: 'Google redirects here — exchanges code for FaithCare JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'JWT returned; is_new_user: true on first sign-in',
  })
  @ApiResponse({
    status: 400,
    description: 'OAUTH_STATE_MISMATCH or expired code',
  })
  @ApiResponse({ status: 403, description: 'OAUTH_EMAIL_NOT_VERIFIED' })
  googleCallback(@Query('code') code: string, @Query('state') state: string) {
    return this.authService.googleCallback(code, state);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a refresh token for a new access token',
    description:
      'Accepts the refresh token from the request body OR the `refresh_token` HttpOnly cookie. ' +
      'Body takes precedence. Next.js apps should proxy this through a route handler that ' +
      'reads the cookie server-side and forwards the token in the body.',
  })
  @ApiResponse({ status: 200, description: 'New access_token returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid refresh token' })
  @ApiResponse({ status: 403, description: 'Request origin not allowed' })
  refreshToken(@Req() req: Request, @Body() body: RefreshTokenDto) {
    // CSRF mitigation: reject requests from unrecognised origins.
    const origin = req.headers['origin'];
    if (
      origin &&
      ALLOWED_ORIGINS.length > 0 &&
      !ALLOWED_ORIGINS.includes(origin)
    ) {
      throw new ForbiddenException('Request origin not allowed');
    }

    // Body takes precedence (Next.js proxy pattern); fall back to cookie.
    const token: string | undefined =
      body?.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
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

  @ApiBearerAuth('access-token')
  @Post('switch-organization/:organizationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange global token for an org-scoped token',
    description:
      'Returns a new access token containing activeOrganizationId and activeOrganizationRole. ' +
      'Use this token for all subsequent requests scoped to that organization.',
  })
  @ApiResponse({ status: 200, description: 'Org-scoped token issued' })
  @ApiResponse({
    status: 401,
    description: 'Not an active member of this organization',
  })
  switchOrganization(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.authService.switchOrganization(user.id, organizationId);
  }
}
