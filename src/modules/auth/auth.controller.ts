import {
  Controller,
  Post,
  Body,
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
import { RequestUser } from 'src/core/types/request-user.interface';
import { AuthService } from './auth.service';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

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
      'The frontend uses the Google Identity Services SDK to get an id_token, then POSTs it here. ' +
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
      'Accepts the refresh token from the request body OR the `refresh_token` HttpOnly cookie. ' +
      'Body takes precedence. Next.js apps should proxy this through a route handler that ' +
      'reads the cookie server-side and forwards the token in the body.',
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

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log out — clears the refresh token cookie',
    description:
      'Clears the HttpOnly refresh_token cookie. The access token remains valid ' +
      'until it expires naturally (stateless JWT), so clients should discard it locally on logout.',
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
    @CurrentUser() user: RequestUser,
  ) {
    return this.authService.switchOrganization(user.id, organizationId);
  }
}
