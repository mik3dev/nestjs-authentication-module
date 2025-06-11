import { DynamicModule, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthClientModuleAsyncOptions, AuthClientModuleOptions } from './interfaces';
import { JwtClientStrategy } from './strategies/jwt-client.strategy';
import { JwtClientAuthGuard } from './guards';

/**
 * Módulo de autenticación para clientes que solo necesitan validar tokens JWT
 * y no requieren la capacidad de generar nuevos tokens.
 */
@Module({})
export class AuthenticationClientModule {
  /**
   * Registra el módulo cliente de forma asíncrona, permitiendo inyección de dependencias
   * para obtener configuración (por ejemplo, desde ConfigService)
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
          useFactory: async (...args: any[]) => opts.useFactory(...args),
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
