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
  /**
   * Registers the authentication module with direct options
   * @param options Authentication module configuration options
   */
  static register(options: AuthModuleOptions): DynamicModule {
    // Create JWT Module with provided configuration
    const jwtModule = JwtModule.register({
      privateKey: options.privateKey,
      publicKey: options.publicKey,
      signOptions: {
        algorithm: 'RS256',
        issuer: options.issuer,
        audience: options.audience,
      },
    });

    // Create the JWKS provider
    const jwksProvider = {
      provide: 'JWKS_SERVICE',
      useValue: {
        getSigningKeys: async () => {
          try {
            // Create a simple structure with the provided public key
            return [{
              kid: 'auth-key-1', // Key identifier
              getPublicKey: () => options.publicKey,
              publicKey: options.publicKey,
            }];
          } catch {
            return [];
          }
        }
      },
    };

    return {
      module: AuthenticationModule,
      imports: [PassportModule, jwtModule],
      providers: [
        {
          provide: 'AUTH_MODULE_OPTIONS',
          useValue: options,
        },
        {
          provide: AuthenticationService,
          useFactory: (jwt: JwtService, opts: AuthModuleOptions) => new AuthenticationService(jwt, opts),
          inject: [JwtService, 'AUTH_MODULE_OPTIONS'],
        },
        {
          provide: JwtStrategy,
          useFactory: (opts: AuthModuleOptions) => new JwtStrategy(opts),
          inject: ['AUTH_MODULE_OPTIONS'],
        },
        {
          provide: RefreshStrategy,
          useFactory: (opts: AuthModuleOptions) => new RefreshStrategy(opts),
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

  /**
   * Registers the authentication module asynchronously, allowing dependency injection
   * to obtain configuration (for example, from ConfigService)
   */
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
            } catch {
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