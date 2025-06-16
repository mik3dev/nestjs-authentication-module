import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
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
      useFactory: async (...args: unknown[]) => {
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

    // Instead of JwksClient, we create a custom provider for JWKS
    const jwksProvider = {
      provide: 'JWKS_SERVICE',
      useFactory: async (...args: unknown[]) => {
        const config = await opts.useFactory(...args);
        // Return an object with the necessary keys for JWKS
        return {
          getSigningKeys: async () => {
            try {
              // Create a simple structure with the provided public key
              return [{
                kid: 'auth-key-1', // Key identifier
                getPublicKey: () => config.publicKey,
                publicKey: config.publicKey,
              }];
            } catch (error) {
              console.error('Error obtaining signing keys:', error);
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
          useFactory: async (...args: unknown[]) => opts.useFactory(...args),
          inject: opts.inject || [],
        },
        {
          provide: AuthenticationService,
          useFactory: (jwt: JwtService, options: AuthModuleOptions) => new AuthenticationService(jwt, options),
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