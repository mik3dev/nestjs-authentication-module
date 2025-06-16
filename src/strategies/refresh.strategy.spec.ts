import { Test } from '@nestjs/testing';
import { RefreshStrategy } from './refresh.strategy';
import { AuthModuleOptions, JwtPayload } from '../interfaces';
import { UnauthorizedException } from '@nestjs/common';

describe('RefreshStrategy', () => {
  let strategy: RefreshStrategy;
  
  const mockOptions: AuthModuleOptions = {
    privateKey: 'test-private-key',
    publicKey: 'test-public-key',
    issuer: 'test-issuer',
    audience: 'test-audience',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  };

  beforeEach(async () => {
    strategy = new RefreshStrategy(mockOptions);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the payload when valid', async () => {
      // Arrange
      const payload: JwtPayload = { 
        sub: '123', 
        username: 'testuser',
        iss: 'test-issuer',
        aud: 'test-audience'
      };
      
      // Act
      const result = await strategy.validate(payload);
      
      // Assert
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException when payload is invalid', async () => {
      // Arrange
      const invalidPayload = {}; // Empty payload
      
      // Act & Assert
      await expect(strategy.validate(invalidPayload as JwtPayload))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });
});
