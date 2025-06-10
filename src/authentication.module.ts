import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwksClient } from 'jwks-rsa';
import { AuthModuleOptions, AuthModuleAsyncOptions } from './interfaces';
import { AuthenticationService } from './authentication.service';
import { JwtStrategy, RefreshStrategy } from './strategies';
import { JwtAuthGuard, JwtRefreshGuard } from './guards';
import { JwksController } from './jwks.controller';

@Module({})
export class AuthenticationModule {
  static registerAsync(opts: AuthModuleAsyncOptions): DynamicModule {
    const jwtModule = JwtModule.registerAsync({
      imports: opts.imports || [],
      useFactory: async (...args: any[]) => {
        const o = await opts.useFactory(...args);
        return {
          privateKey: o.privateKey,
          publicKey: o.publicKey,
          signOptions: {
            algorithm: 'RS256',
            issuer: o.issuer,
            audience: o.audience,
          },
        };
      },
      inject: opts.inject || [],
    });

    // En lugar de JwksClient, creamos un provider personalizado para JWKS
    const jwksProvider = {
      provide: 'JWKS_SERVICE',
      useFactory: async (...args: any[]) => {
        const config = await opts.useFactory(...args);
        // Retornamos un objeto con las claves necesarias para JWKS
        return {
          getSigningKeys: async () => {
            try {
              // Creamos una estructura simple con la clave pública proporcionada
              return [{
                kid: 'auth-key-1', // Identificador de la clave
                getPublicKey: () => config.publicKey,
                publicKey: config.publicKey,
              }];
            } catch (error) {
              console.error('Error al obtener signing keys:', error);
              return [];
            }
          }
        };
      },
      inject: opts.inject || [],
    };

    return {
      module: AuthenticationModule,
      imports: [PassportModule, jwtModule, ...(opts.imports || [])],
      providers: [
        {
          provide: 'AUTH_MODULE_OPTIONS',
          useFactory: async (...args: any[]) => opts.useFactory(...args),
          inject: opts.inject || [],
        },
        {
          provide: AuthenticationService,
          useFactory: (jwt: JwtService, options: AuthModuleOptions) => new AuthenticationService(jwt as any, options),
          inject: [JwtService, 'AUTH_MODULE_OPTIONS'],
        },
        {
          provide: JwtStrategy,
          useFactory: (options: AuthModuleOptions) => new JwtStrategy(options),
          inject: ['AUTH_MODULE_OPTIONS'],
        },
        {
          provide: RefreshStrategy,
          useFactory: (options: AuthModuleOptions) => new RefreshStrategy(options),
          inject: ['AUTH_MODULE_OPTIONS'],
        },
        JwtAuthGuard,
        JwtRefreshGuard,
        jwksProvider,
        JwksController,
      ],
      exports: [AuthenticationService, JwtAuthGuard, JwtRefreshGuard],
      controllers: [JwksController],
    };
  }
}