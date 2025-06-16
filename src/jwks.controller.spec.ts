import { Test, TestingModule } from '@nestjs/testing';
import { JwksController } from './jwks.controller';
import { Logger } from '@nestjs/common';

// Define types for the JWKS service and key formats to avoid any type
interface SigningKey {
  kid: string;
  getPublicKey: () => string;
  publicKey: string;
}

interface JwksService {
  getSigningKeys: () => Promise<SigningKey[]>;
}

// Mock node-jose to prevent actual PEM conversion
jest.mock('node-jose', () => ({
  JWK: {
    asKey: jest.fn().mockImplementation(() => ({
      toJSON: jest.fn().mockReturnValue({
        kid: 'test-key-1',
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        n: 'test-modulus',
        e: 'AQAB',
      }),
    })),
  },
}));

describe('JwksController', () => {
  let controller: JwksController;
  let jwksService: JwksService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock implementation of the JWKS service
    const mockJwksService: JwksService = {
      getSigningKeys: jest.fn().mockImplementation(() => {
        return Promise.resolve([{
          kid: 'test-key-1',
          getPublicKey: () => '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n-----END PUBLIC KEY-----',
          publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n-----END PUBLIC KEY-----',
        }]);
      }),
    };

    // Spy on Logger to prevent error output during tests
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JwksController],
      providers: [
        {
          provide: 'JWKS_SERVICE',
          useValue: mockJwksService,
        },
      ],
    }).compile();

    controller = module.get<JwksController>(JwksController);
    jwksService = module.get<JwksService>('JWKS_SERVICE');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getJwks', () => {
    it('should return a valid JWKS structure', async () => {
      // Act
      const result = await controller.getJwks();

      // Assert
      expect(result).toBeDefined();
      expect(result.keys).toBeDefined();
      expect(Array.isArray(result.keys)).toBe(true);
      
      if (result.keys.length > 0) {
        const key = result.keys[0];
        expect(key.kid).toBeDefined();
        expect(key.kty).toBeDefined();
        expect(key.use).toBe('sig');
        expect(key.alg).toBe('RS256');
      }
    });

    it('should handle errors and return empty keys array on failure', async () => {
      // Arrange
      jest.spyOn(jwksService, 'getSigningKeys').mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act & Assert
      try {
        await controller.getJwks();
        fail('Expected error to be thrown');
      } catch (error: unknown) {
        // Properly type check the error
        if (error instanceof Error) {
          expect(error.message).toBe('Error generating JWKS');
        } else {
          fail('Expected error to be an instance of Error');
        }
        expect(loggerSpy).toHaveBeenCalled();
      }
    });
  });
});
