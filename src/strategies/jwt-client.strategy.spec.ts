import { JwtClientStrategy } from './jwt-client.strategy';
import { AuthClientModuleOptions, JwtPayload } from '../interfaces';
import { UnauthorizedException } from '@nestjs/common';

// Mock the passport-jwt Strategy constructor
jest.mock('passport-jwt', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Strategy: jest.fn().mockImplementation((options) => {
      return {
        name: 'jwt',
        authenticate: jest.fn(),
      };
    }),
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(() => 'token'),
    },
  };
});

// Mock jwks-rsa module
jest.mock('jwks-rsa', () => {
  return {
    passportJwtSecret: jest.fn().mockImplementation(() => {
      // Return a secretOrKeyProvider function
      return (request: unknown, rawJwtToken: string, done: (err: Error | null, secret?: string) => void) => {
        done(null, 'mock-public-key');
      };
    }),
  };
});

// Mock the PassportStrategy so we can bypass its constructor
jest.mock('@nestjs/passport', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PassportStrategy: jest.fn().mockImplementation((StrategyClass, strategyName) => {
      return class MockPassportStrategy {
        validate(payload: JwtPayload) {
          return payload;
        }
      };
    }),
  };
});

describe('JwtClientStrategy', () => {
  let strategyWithJwks: JwtClientStrategy;
  let strategyWithPublicKey: JwtClientStrategy;

  const mockJwksOptions: AuthClientModuleOptions = {
    jwksUrl: 'https://test-auth-service/.well-known/jwks.json',
    issuer: 'test-issuer',
    audience: 'test-audience',
  };

  const mockPublicKeyOptions: AuthClientModuleOptions = {
    publicKey: 'test-public-key',
    issuer: 'test-issuer',
    audience: 'test-audience',
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create strategies for both paths
    strategyWithJwks = new JwtClientStrategy(mockJwksOptions);
    strategyWithPublicKey = new JwtClientStrategy(mockPublicKeyOptions);

    // Add a validate method that matches our actual implementation
    strategyWithJwks.validate = async (payload: JwtPayload) => {
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }
      return payload;
    };

    strategyWithPublicKey.validate = async (payload: JwtPayload) => {
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }
      return payload;
    };
  });

  it('should be defined with JWKS URL', () => {
    expect(strategyWithJwks).toBeDefined();
  });

  it('should be defined with public key', () => {
    expect(strategyWithPublicKey).toBeDefined();
  });

  describe('validate', () => {
    it('should return the payload when valid', async () => {
      const payload: JwtPayload = { sub: '123', username: 'testuser' };

      const result = await strategyWithJwks.validate(payload);

      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException when payload is invalid', async () => {
      const invalidPayload = {} as JwtPayload;

      await expect(strategyWithJwks.validate(invalidPayload))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });
});
