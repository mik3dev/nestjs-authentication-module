import { ModuleMetadata } from '@nestjs/common';

export interface AuthModuleOptions {
  /** Private key for signing JWTs */
  privateKey: string;
  /** Public key or JWKS URL */
  publicKey: string;
  /** Issuer (iss claim) */
  issuer: string;
  /** Audience (aud claim) */
  audience: string;
  /** Access token expiresIn */
  accessTokenExpiresIn?: string;
  /** Refresh token expiresIn */
  refreshTokenExpiresIn?: string;
}

export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AuthModuleOptions> | AuthModuleOptions;
  inject?: any[];
}