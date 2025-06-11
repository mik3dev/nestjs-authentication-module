import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guardia de autenticación para aplicaciones cliente que solo necesitan validar tokens
 * 
 * Utiliza la estrategia JwtClientStrategy que puede validar tokens mediante:
 * 1. Una clave pública directa
 * 2. Un endpoint JWKS remoto
 * 
 * Ejemplo de uso:
 * ```typescript
 * @UseGuards(JwtClientAuthGuard)
 * @Get('perfil')
 * getProfile() {
 *   // Esta ruta está protegida y solo accesible con un JWT válido
 * }
 * ```
 */
@Injectable()
export class JwtClientAuthGuard extends AuthGuard('jwt') { }
