import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthModuleOptions } from './interfaces';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly options: AuthModuleOptions,
  ) { }

  async signAccessToken(payload: any) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.options.accessTokenExpiresIn,
      algorithm: 'RS256',
      issuer: this.options.issuer,
      audience: this.options.audience,
    });
  }

  async signRefreshToken(payload: any) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.options.refreshTokenExpiresIn,
      algorithm: 'RS256',
      issuer: this.options.issuer,
      audience: this.options.audience,
    });
  }
}