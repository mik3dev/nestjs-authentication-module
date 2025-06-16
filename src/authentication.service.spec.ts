import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationService } from './authentication.service';
import { AuthModuleOptions } from './interfaces';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let jwtService: JwtService;

  const mockOptions: AuthModuleOptions = {
    privateKey: 'test-private-key',
    publicKey: 'test-public-key',
    issuer: 'test-issuer',
    audience: 'test-audience',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  };
  
  const mockJwtService = {
    signAsync: jest.fn().mockImplementation(() => Promise.resolve('test-token')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: 'AUTH_MODULE_OPTIONS',
          useValue: mockOptions,
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signAccessToken', () => {
    it('should call signAsync with correct parameters', async () => {
      // Use the correct JwtPayload typing to maintain type safety
      const payload = { sub: '123', username: 'testuser' };
      
      await service.signAccessToken(payload);
      
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        payload,
        {
          expiresIn: mockOptions.accessTokenExpiresIn,
          algorithm: 'RS256',
          issuer: mockOptions.issuer,
          audience: mockOptions.audience,
        },
      );
    });
  });

  describe('signRefreshToken', () => {
    it('should call signAsync with correct parameters', async () => {
      const payload = { sub: '123', username: 'testuser' };
      
      await service.signRefreshToken(payload);
      
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        payload,
        {
          expiresIn: mockOptions.refreshTokenExpiresIn,
          algorithm: 'RS256',
          issuer: mockOptions.issuer,
          audience: mockOptions.audience,
        },
      );
    });
  });
});
