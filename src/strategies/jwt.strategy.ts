import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthModuleOptions } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(options: AuthModuleOptions) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: options.publicKey,
      algorithms: ['RS256'],
      issuer: options.issuer,
      audience: options.audience,
    });
  }

  async validate(payload: any) {
    return payload; // attach payload as req.user
  }
}