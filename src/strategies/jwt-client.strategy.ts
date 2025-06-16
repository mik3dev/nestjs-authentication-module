import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { AuthClientModuleOptions, JwtPayload } from '../interfaces';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtClientStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(options: AuthClientModuleOptions) {
    if (!options.publicKey && !options.jwksUrl) {
      throw new Error('Either publicKey or jwksUrl must be provided for JWT validation');
    }

    // Create base options object with properly typed algorithm
    const baseOptions: Partial<StrategyOptionsWithoutRequest> = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'] as const, // Type assertion is needed because passport-jwt expects Algorithm[] but allows string[] at runtime
      issuer: options.issuer,
      audience: options.audience,
    };

    if (options.jwksUrl) {
      // Add secretOrKeyProvider for JWKS
      const jwksOptions = {
        ...baseOptions,
        secretOrKeyProvider: passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: options.jwksUrl,
        })
      };

      // The type assertion below is necessary because the passport-jwt types don't fully
      // account for the JWKS configuration pattern we're using. The JWKS integration uses
      // secretOrKeyProvider instead of secretOrKey, which creates a type mismatch that needs
      // to be reconciled with the StrategyOptionsWithoutRequest type.
      super(jwksOptions as StrategyOptionsWithoutRequest);
    } else if (options.publicKey) {
      const publicKeyOptions = {
        ...baseOptions,
        secretOrKey: options.publicKey
      };

      // This type assertion ensures our options object conforms to what passport-jwt expects.
      // While our options are valid at runtime, TypeScript's strict typing requires this assertion
      // to reconcile the actual structure with the expected interface.
      super(publicKeyOptions as StrategyOptionsWithoutRequest);
    }
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}
