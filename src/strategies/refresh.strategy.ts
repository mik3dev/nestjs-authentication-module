import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { AuthModuleOptions, JwtPayload } from '../interfaces';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(options: AuthModuleOptions) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      secretOrKey: options.publicKey,
      algorithms: ['RS256'] as const, // Type assertion is needed because passport-jwt expects Algorithm[] but allows string[] at runtime
      issuer: options.issuer,
      audience: options.audience,
    } as StrategyOptionsWithoutRequest); // This type assertion ensures compatibility with passport-jwt's expected option structure
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}