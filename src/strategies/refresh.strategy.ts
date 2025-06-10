import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthModuleOptions } from '../interfaces';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(options: AuthModuleOptions) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      secretOrKey: options.publicKey,
      algorithms: ['RS256'],
      issuer: options.issuer,
      audience: options.audience,
    });
  }

  async validate(payload: any) {
    return payload;
  }
}