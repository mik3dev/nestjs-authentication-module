import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards';
import { GetUser } from '../decorators';

// Example user interface with typed properties
interface UserPayload {
  sub: string;
  username: string;
  roles: string[];
  email: string;
}

@Controller('users')
export class UserController {
  /**
   * Example using the GetUser decorator with full type safety
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser<UserPayload>() user: UserPayload) {
    return {
      userId: user.sub,
      username: user.username,
      roles: user.roles,
      email: user.email
    };
  }

  /**
   * Example accessing a specific property from the user object
   */
  @UseGuards(JwtAuthGuard)
  @Get('roles')
  getUserRoles(@GetUser<string[]>('roles') roles: string[]) {
    return { roles };
  }
  
  /**
   * Example showing the flexibility of the decorator with different types
   */
  @UseGuards(JwtAuthGuard)
  @Get('id')
  getUserId(@GetUser<string>('sub') userId: string) {
    return { userId };
  }
}
