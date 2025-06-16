import { Test } from '@nestjs/testing';
import { AuthenticationClientModule } from './authentication-client.module';
import { AuthClientModuleOptions, AuthClientModuleAsyncOptions } from './interfaces';
import { JwtClientStrategy } from './strategies/jwt-client.strategy';
import { JwtClientAuthGuard } from './guards';

describe('AuthenticationClientModule', () => {
  const mockOptions: AuthClientModuleOptions = {
    jwksUrl: 'https://test-auth-service/.well-known/jwks.json',
    issuer: 'test-issuer',
    audience: 'test-audience',
  };

  // Setup before each test
  beforeEach(() => {
    jest.resetAllMocks();
    // Note: the JwksClient is already mocked at the top of the file
  });

  describe('register', () => {
    it('should compile the module with direct options', async () => {
      const module = await Test.createTestingModule({
        imports: [AuthenticationClientModule.register(mockOptions)],
      }).compile();

      expect(module).toBeDefined();
      
      const jwtClientStrategy = module.get<JwtClientStrategy>(JwtClientStrategy);
      const jwtClientAuthGuard = module.get<JwtClientAuthGuard>(JwtClientAuthGuard);

      expect(jwtClientStrategy).toBeInstanceOf(JwtClientStrategy);
      expect(jwtClientAuthGuard).toBeInstanceOf(JwtClientAuthGuard);
    });
  });

  describe('registerAsync', () => {
    it('should compile the module with async options', async () => {
      const asyncOptions: AuthClientModuleAsyncOptions = {
        useFactory: () => mockOptions,
      };

      const module = await Test.createTestingModule({
        imports: [AuthenticationClientModule.registerAsync(asyncOptions)],
      }).compile();

      expect(module).toBeDefined();
      
      const jwtClientStrategy = module.get<JwtClientStrategy>(JwtClientStrategy);
      expect(jwtClientStrategy).toBeInstanceOf(JwtClientStrategy);
    });
    
    it('should work with imports and inject', async () => {
      // Create a mock config service
      class MockConfigService {
        get(key: string): string {
          const config: Record<string, string> = {
            JWKS_URL: 'https://test-auth-service/.well-known/jwks.json',
            JWT_ISSUER: 'test-issuer',
            JWT_AUDIENCE: 'test-audience',
          };
          return config[key] || '';
        }
      }

      const asyncOptions: AuthClientModuleAsyncOptions = {
        imports: [
          {
            module: class MockConfigModule {},
            providers: [
              {
                provide: MockConfigService,
                useClass: MockConfigService,
              },
            ],
            exports: [MockConfigService],
          },
        ],
        inject: [MockConfigService],
        // Use a type assertion here to resolve the typing issue with unknown[] args
        useFactory: ((...args: unknown[]) => {
          const configService = args[0] as MockConfigService;
          return {
            jwksUrl: configService.get('JWKS_URL'),
            issuer: configService.get('JWT_ISSUER'),
            audience: configService.get('JWT_AUDIENCE'),
          };
        }),
      };

      const module = await Test.createTestingModule({
        imports: [AuthenticationClientModule.registerAsync(asyncOptions)],
      }).compile();

      expect(module).toBeDefined();
    });
  });
});
