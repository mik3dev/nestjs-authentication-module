import { Controller, Get, Inject, Logger } from '@nestjs/common';
import * as jose from 'node-jose';

// Definición de la interfaz para un JWK (JSON Web Key)
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
  [key: string]: any; // Otras propiedades
}

@Controller('.well-known')
export class JwksController {
  private readonly logger = new Logger(JwksController.name);
  
  constructor(@Inject('JWKS_SERVICE') private jwksService: any) { }

  @Get('jwks.json')
  async getJwks() {
    try {
      // Obtenemos las claves de firma de nuestro servicio personalizado
      const keys = await this.jwksService.getSigningKeys();
      
      // Procesamos cada clave para convertirla en formato JWK
      const jwkPromises = keys.map(async (key: any) => {
        try {
          // Extraemos la clave pública
          const publicKeyPEM = typeof key.getPublicKey === 'function' 
            ? key.getPublicKey() 
            : key.publicKey;
          
          if (!publicKeyPEM) {
            this.logger.warn('Clave pública no disponible');
            return null;
          }

          // Usamos node-jose para convertir el PEM a JWK
          const keystore = jose.JWK.createKeyStore();
          const jwk = await this.pemToJwk(publicKeyPEM);
          
          if (!jwk) {
            this.logger.warn('No se pudo convertir la clave PEM a JWK');
            return null;
          }
          
          // Aseguramos los campos obligatorios
          return {
            ...jwk,
            kid: key.kid || jwk.kid || 'auth-key-1',
            use: 'sig',
            alg: 'RS256',
          };
        } catch (error: any) {
          this.logger.error(`Error procesando clave: ${error?.message || 'Error desconocido'}`, error?.stack);
          return null;
        }
      });
      
      // Esperamos a que se procesen todas las claves
      const processedKeys = await Promise.all(jwkPromises);
      
      // Filtramos las claves nulas y retornamos el JWKS
      return {
        keys: processedKeys.filter(key => key !== null)
      };
    } catch (error: any) {
      this.logger.error(`Error generando JWKS: ${error?.message || 'Error desconocido'}`, error?.stack);
      throw new Error('Error generando JWKS');
    }
  }
  
  /**
   * Convierte una clave pública en formato PEM a formato JWK
   * @param pemKey Clave pública en formato PEM
   * @returns Objeto JWK con los componentes de la clave
   */
  private async pemToJwk(pemKey: string): Promise<JsonWebKey> {
    try {
      // Verificamos si la clave tiene el formato correcto
      if (!pemKey.includes('-----BEGIN') && !pemKey.includes('-----END')) {
        this.logger.warn('La clave proporcionada no tiene formato PEM válido');
        return this.createFallbackJwk();
      }

      // Utilizamos node-jose para importar la clave y convertirla a JWK
      const key = await jose.JWK.asKey(pemKey, 'pem');
      // Utilizamos una aserción de tipo para indicar que el resultado es un JsonWebKey
      const jwk = key.toJSON() as JsonWebKey;

      // Verificamos si tenemos los componentes necesarios
      if (!jwk.n || !jwk.e) {
        this.logger.warn('La conversión a JWK no generó los componentes n y e');
        return this.createFallbackJwk();
      }

      return jwk;
    } catch (error: any) {
      this.logger.error(`Error convirtiendo PEM a JWK: ${error?.message || 'Error desconocido'}`, error?.stack);
      return this.createFallbackJwk();
    }
  }

  /**
   * Crea un JWK de respaldo si no se puede extraer la información de la clave real
   * @returns Un objeto JWK con valores seguros de respaldo
   */
  private createFallbackJwk(): JsonWebKey {
    this.logger.warn('Usando valores de respaldo para JWK');
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