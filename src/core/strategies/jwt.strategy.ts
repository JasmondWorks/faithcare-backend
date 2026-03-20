import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;       // user id
  email: string;
  role: string;
  organizationId?: string;
  organizationRole?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret') as string,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) throw new UnauthorizedException();
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
      organizationRole: payload.organizationRole,
    };
  }
}
