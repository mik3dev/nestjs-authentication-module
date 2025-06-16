import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthModuleOptions, JwtPayload } from './interfaces';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('AUTH_MODULE_OPTIONS') private readonly options: AuthModuleOptions,
  ) { }

  async signAccessToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.options.accessTokenExpiresIn,
      algorithm: 'RS256',
      issuer: this.options.issuer,
      audience: this.options.audience,
    });
  }

  async signRefreshToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.options.refreshTokenExpiresIn,
      algorithm: 'RS256',
      issuer: this.options.issuer,
      audience: this.options.audience,
    });
  }
}