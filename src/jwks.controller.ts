import { Controller, Get, Inject, Logger } from '@nestjs/common';
import * as jose from 'node-jose';

// Interface for JWKS service
interface JwksService {
  getSigningKeys(): Promise<SigningKey[]>;
}

// Interface for signing keys
interface SigningKey {
  kid?: string;
  publicKey?: string;
  getPublicKey?: () => string;
}

// Definition of the interface for a JWK (JSON Web Key)
interface JsonWebKey {
  kty: string;       // Key Type (RSA, EC, etc.)
  kid?: string;      // Key ID
  use?: string;      // Public Key Use (sig, enc)
  alg?: string;      // Algorithm
  n?: string;        // RSA Modulus
  e?: string;        // RSA Exponent
  x5u?: string;      // X.509 URL
  x5c?: string[];    // X.509 Certificate Chain
  x5t?: string;      // X.509 Certificate SHA-1 Thumbprint
  [key: string]: unknown; // Other properties
}

@Controller('.well-known')
export class JwksController {
  private readonly logger = new Logger(JwksController.name);

  constructor(@Inject('JWKS_SERVICE') private jwksService: JwksService) { }

  @Get('jwks.json')
  async getJwks() {
    try {
      // Get signing keys from our custom service
      const keys = await this.jwksService.getSigningKeys();

      // Process each key to convert it into JWK format
      const jwkPromises = keys.map(async (key: SigningKey) => {
        try {
          // Extract the public key
          const publicKeyPEM = typeof key.getPublicKey === 'function'
            ? key.getPublicKey()
            : key.publicKey;

          if (!publicKeyPEM) {
            this.logger.warn('Public key not available');
            return null;
          }

          // Use node-jose to convert PEM to JWK
          const jwk = await this.pemToJwk(publicKeyPEM);

          if (!jwk) {
            this.logger.warn('Could not convert PEM key to JWK');
            return null;
          }

          // Ensure required fields are present
          return {
            ...jwk,
            kid: key.kid || jwk.kid || 'auth-key-1',
            use: 'sig',
            alg: 'RS256',
          };
        } catch (error: unknown) {
          const err = error as Error;
          this.logger.error(`Error processing key: ${err?.message || 'Unknown error'}`, err?.stack);
          return null;
        }
      });

      // Wait for all keys to be processed
      const processedKeys = await Promise.all(jwkPromises);

      // Filter out null keys and return the JWKS
      return {
        keys: processedKeys.filter(key => key !== null)
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error generating JWKS: ${err?.message || 'Unknown error'}`, err?.stack);
      throw new Error('Error generating JWKS');
    }
  }

  /**
   * Converts a public key from PEM format to JWK format
   * @param pemKey Public key in PEM format
   * @returns JWK object with key components
   */
  private async pemToJwk(pemKey: string): Promise<JsonWebKey> {
    try {
      // Verificamos si la clave tiene el formato correcto
      if (!pemKey.includes('-----BEGIN') && !pemKey.includes('-----END')) {
        this.logger.warn('The provided key does not have a valid PEM format');
        return this.createFallbackJwk();
      }

      // Use node-jose to import the key and convert it to JWK
      const key = await jose.JWK.asKey(pemKey, 'pem');
      // Use a type assertion to indicate that the result is a JsonWebKey
      const jwk = key.toJSON() as JsonWebKey;

      // Verify if we have the necessary components
      if (!jwk.n || !jwk.e) {
        this.logger.warn('The conversion to JWK did not generate components n and e');
        return this.createFallbackJwk();
      }

      return jwk;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error converting PEM to JWK: ${err?.message || 'Unknown error'}`, err?.stack);
      return this.createFallbackJwk();
    }
  }

  /**
   * Creates a fallback JWK if the information from the actual key cannot be extracted
   * @returns A JWK object with safe fallback values
   */
  private createFallbackJwk(): JsonWebKey {
    this.logger.warn('Using fallback values for JWK');
    return {
      kty: 'RSA',
      n: 'FALLBACK_MODULUS_VALUE',
      e: 'AQAB',
      kid: `auth-key-${Date.now()}`,
      alg: 'RS256',
      use: 'sig'
    };
  }
}