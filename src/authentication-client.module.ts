import { DynamicModule, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthClientModuleAsyncOptions, AuthClientModuleOptions } from './interfaces';
import { JwtClientStrategy } from './strategies/jwt-client.strategy';
import { JwtClientAuthGuard } from './guards';

/**
 * Authentication module for clients that only need to validate JWT tokens
 * and do not require the ability to generate new tokens.
 */
@Module({})
export class AuthenticationClientModule {
  /**
   * Registers the client module with direct options
   * @param options Authentication client configuration options
   */
  static register(options: AuthClientModuleOptions): DynamicModule {
    return {
      module: AuthenticationClientModule,
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        {
          provide: 'AUTH_CLIENT_OPTIONS',
          useValue: options,
        },
        {
          provide: JwtClientStrategy,
          useFactory: (opts: AuthClientModuleOptions) => new JwtClientStrategy(opts),
          inject: ['AUTH_CLIENT_OPTIONS'],
        },
        JwtClientAuthGuard,
      ],
      exports: [JwtClientAuthGuard],
    };
  }

  /**
   * Registers the client module asynchronously, allowing dependency injection
   * to obtain configuration (for example, from ConfigService)
   */
  static registerAsync(opts: AuthClientModuleAsyncOptions): DynamicModule {
    return {
      module: AuthenticationClientModule,
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ...(opts.imports || [])
      ],
      providers: [
        {
          provide: 'AUTH_CLIENT_OPTIONS',
          useFactory: async (...args: unknown[]) => opts.useFactory(...args),
          inject: opts.inject || [],
        },
        {
          provide: JwtClientStrategy,
          useFactory: (options: AuthClientModuleOptions) => new JwtClientStrategy(options),
          inject: ['AUTH_CLIENT_OPTIONS'],
        },
        JwtClientAuthGuard,
      ],
      exports: [JwtClientAuthGuard],
    };
  }
}
