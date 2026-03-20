import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Public } from 'src/core/decorators/public.decorator';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate as a church admin — returns an 8-hour JWT' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return this.authService.adminLogin(adminLoginDto);
  }

  @Public()
  @Post('user/register')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({ status: 201, description: 'Account created, JWT returned' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  userRegister(@Body() userRegisterDto: UserRegisterDto) {
    return this.authService.userRegister(userRegisterDto);
  }

  @Public()
  @Post('user/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password — returns a 30-day user JWT' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  userLogin(@Body() userLoginDto: UserLoginDto) {
    return this.authService.userLogin(userLoginDto);
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth 2.0 flow — redirects to Google consent screen' })
  googleAuth() {
    return this.authService.googleAuth();
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google redirects here — exchanges code for FaithCare JWT' })
  @ApiResponse({ status: 200, description: 'JWT returned; is_new_user: true on first sign-in' })
  @ApiResponse({ status: 400, description: 'OAUTH_STATE_MISMATCH or expired code' })
  @ApiResponse({ status: 403, description: 'OAUTH_EMAIL_NOT_VERIFIED' })
  googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    return this.authService.googleCallback(code, state);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access token' })
  @ApiResponse({ status: 200, description: 'New access_token returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP code sent during registration' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'OTP is invalid or has expired' })
  verifyEmailOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyEmailOtp(verifyOtpDto);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP for email verification or password reset' })
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
  @ApiResponse({ status: 401, description: 'Not an active member of this organization' })
  switchOrganization(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.authService.switchOrganization(user.id, organizationId);
  }
}
