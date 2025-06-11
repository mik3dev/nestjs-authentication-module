import { ModuleMetadata } from '@nestjs/common';

/**
 * Opciones para configurar el módulo principal de autenticación con capacidad de emisión de tokens
 */
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

/**
 * Opciones para configurar el módulo cliente de autenticación (solo validación de tokens)
 */
export interface AuthClientModuleOptions {
  /** Public key for verifying JWTs */
  publicKey?: string;
  /** JWKS URL endpoint (alternative to publicKey) */
  jwksUrl?: string;
  /** Issuer (iss claim) */
  issuer: string;
  /** Audience (aud claim) */
  audience: string;
}

/**
 * Opciones para configurar el módulo principal de autenticación de manera asíncrona
 */
export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AuthModuleOptions> | AuthModuleOptions;
  inject?: any[];
}

/**
 * Opciones para configurar el módulo cliente de autenticación de manera asíncrona
 */
export interface AuthClientModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AuthClientModuleOptions> | AuthClientModuleOptions;
  inject?: any[];
}