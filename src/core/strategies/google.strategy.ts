import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('google.clientId') as string,
      clientSecret: config.get<string>('google.clientSecret') as string,
      callbackURL: config.get<string>('google.callbackUrl') as string,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0];
    const googleProfile: GoogleProfile = {
      googleId: profile.id,
      email: email?.value ?? '',
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
      emailVerified: email?.verified === 'true' || email?.verified === true,
    };
    done(null, googleProfile);
  }
}
