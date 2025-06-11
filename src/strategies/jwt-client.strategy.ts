import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthClientModuleOptions } from '../interfaces';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtClientStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(options: AuthClientModuleOptions) {
    if (!options.publicKey && !options.jwksUrl) {
      throw new Error('Either publicKey or jwksUrl must be provided for JWT validation');
    }

    const jwtOptions: any = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      issuer: options.issuer,
      audience: options.audience,
    };

    // Si tenemos una URL de JWKS, configuramos el cliente JWKS-RSA
    if (options.jwksUrl) {
      jwtOptions.secretOrKeyProvider = passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: options.jwksUrl,
      });
    } else if (options.publicKey) {
      // Si tenemos una clave pública directa
      jwtOptions.secretOrKey = options.publicKey;
    }

    super(jwtOptions);
  }

  // La validación simplemente devuelve el payload para que esté disponible en req.user
  async validate(payload: any) {
    return payload;
  }
}
