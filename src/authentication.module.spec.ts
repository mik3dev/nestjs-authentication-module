import { Test } from '@nestjs/testing';
import { AuthenticationModule } from './authentication.module';
import { AuthModuleOptions, AuthModuleAsyncOptions } from './interfaces';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationService } from './authentication.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';

describe('AuthenticationModule', () => {
  const mockOptions: AuthModuleOptions = {
    privateKey: 'test-private-key',
    publicKey: 'test-public-key',
    issuer: 'test-issuer',
    audience: 'test-audience',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  };

  describe('register', () => {
    it('should compile the module with direct options', async () => {
      const module = await Test.createTestingModule({
        imports: [AuthenticationModule.register(mockOptions)],
      }).compile();

      expect(module).toBeDefined();

      const authService = module.get<AuthenticationService>(AuthenticationService);
      const jwtService = module.get<JwtService>(JwtService);

      expect(authService).toBeInstanceOf(AuthenticationService);
      expect(jwtService).toBeDefined();
    });

    it('should provide the correct strategies', async () => {
      const module = await Test.createTestingModule({
        imports: [AuthenticationModule.register(mockOptions)],
      }).compile();

      const jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
      const refreshStrategy = module.get<RefreshStrategy>(RefreshStrategy);

      expect(jwtStrategy).toBeInstanceOf(JwtStrategy);
      expect(refreshStrategy).toBeInstanceOf(RefreshStrategy);
    });
  });

  describe('registerAsync', () => {
    it('should compile the module with async options', async () => {
      const asyncOptions: AuthModuleAsyncOptions = {
        useFactory: () => mockOptions,
      };

      const module = await Test.createTestingModule({
        imports: [AuthenticationModule.registerAsync(asyncOptions)],
      }).compile();

      expect(module).toBeDefined();

      const authService = module.get<AuthenticationService>(AuthenticationService);
      expect(authService).toBeInstanceOf(AuthenticationService);
    });
  });
});
