import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { AuthModuleOptions, JwtPayload } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(options: AuthModuleOptions) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: options.publicKey,
      algorithms: ['RS256'] as const, // Type assertion is needed because passport-jwt expects Algorithm[] but allows string[] at runtime
      issuer: options.issuer,
      audience: options.audience,
    } as StrategyOptionsWithoutRequest); // This type assertion ensures compatibility with passport-jwt's expected option structure
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Validate that payload has required fields
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload; // attach payload as req.user
  }
}