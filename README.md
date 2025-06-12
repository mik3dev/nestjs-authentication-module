# NestJS Authentication Module

A comprehensive JWT authentication library for NestJS microservices that provides both token generation and validation capabilities.

## Features

- **JWT Authentication Server**: Generate and validate JWT tokens with RS256 algorithm
- **JWT Authentication Client**: Validate tokens without generation capabilities
- **JWKS Endpoint**: Expose public keys for client validation
- **Guards**: Ready-to-use authentication guards for protecting routes
- **Refresh Token Support**: Built-in refresh token handling

## Installation

```bash
npm install nestjs-authentication-module
```

## Usage

This library can be used in two different ways:

1. **Authentication Server**: For microservices that need to generate and validate JWT tokens (access and refresh tokens)
2. **Authentication Client**: For microservices that only need to validate tokens

### Authentication Server Usage

For services that need to generate tokens (auth microservices):

```typescript
import { Module } from '@nestjs/common';
import { AuthenticationModule } from 'nestjs-authentication-module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthenticationModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        privateKey: configService.get<string>('JWT_PRIVATE_KEY'),
        publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
        issuer: configService.get<string>('JWT_ISSUER', 'auth-service'),
        audience: configService.get<string>('JWT_AUDIENCE', 'api'),
        expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        refreshExpiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')
      }),
    }),
  ],
})
export class AppModule {}
```

Using the authentication service:

```typescript
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { AuthenticationService } from 'nestjs-authentication-module';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('login')
  async login(@Body() user: any) {
    // Verify user credentials (implementation depends on your user service)
    
    // Generate tokens
    const payload = { sub: user.id, username: user.username };
    const { accessToken, refreshToken } = await this.authService.generateTokens(payload);

    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(body.refreshToken);
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }
}
```

### Authentication Client Usage

For services that only need to validate tokens:

```typescript
import { Module } from '@nestjs/common';
import { AuthenticationClientModule } from 'nestjs-authentication-module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthenticationClientModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        jwksUri: configService.get<string>('AUTH_JWKS_URI'),
        // Alternative to jwksUri: provide the public key directly
        // publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
        issuer: configService.get<string>('JWT_ISSUER'),
        audience: configService.get<string>('JWT_AUDIENCE'),
      }),
    }),
  ],
})
export class AppModule {}
```

Protecting routes with the JWT guard:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtClientAuthGuard } from 'nestjs-authentication-module';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtClientAuthGuard)
  @Get()
  getProtectedResource() {
    return { message: 'This route is protected by JWT authentication' };
  }
}
```

## API Reference

### AuthenticationModule

The main module for services that generate and validate tokens.

```typescript
AuthenticationModule.registerAsync(options: AuthModuleAsyncOptions)
```

#### AuthModuleAsyncOptions

| Property | Type | Description |
|----------|------|-------------|
| imports | Array | Optional NestJS modules to import |
| inject | Array | Dependencies to inject into the factory |
| useFactory | Function | Factory function that returns AuthModuleOptions |

#### AuthModuleOptions

| Property | Type | Description |
|----------|------|-------------|
| privateKey | string | RSA private key for signing tokens |
| publicKey | string | RSA public key for verifying tokens |
| issuer | string | JWT issuer claim |
| audience | string | JWT audience claim |
| expiresIn | string | Access token expiration (e.g. '15m') |
| refreshExpiresIn | string | Refresh token expiration (e.g. '7d') |

### AuthenticationClientModule

Module for services that only validate tokens.

```typescript
AuthenticationClientModule.registerAsync(options: AuthClientModuleAsyncOptions)
```

#### AuthClientModuleAsyncOptions

| Property | Type | Description |
|----------|------|-------------|
| imports | Array | Optional NestJS modules to import |
| inject | Array | Dependencies to inject into the factory |
| useFactory | Function | Factory function that returns AuthClientModuleOptions |

#### AuthClientModuleOptions

| Property | Type | Description |
|----------|------|-------------|
| jwksUri | string | URI to the JWKS endpoint |
| publicKey | string | Optional RSA public key if not using jwksUri |
| issuer | string | JWT issuer to validate |
| audience | string | JWT audience to validate |

## License

ISC
