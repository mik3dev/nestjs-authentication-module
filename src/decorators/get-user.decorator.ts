import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator that extracts the authenticated user from the request.
 * Optionally allows specifying which property of the user object to extract.
 * 
 * @example
 * ** Get the entire user object with type safety
 * @Get('profile')
 * getProfile(@GetUser() user: UserType) {
 *   return user;
 * }
 * 
 * @example
 * ** Get a specific property from the user
 * @Get('username')
 * getUsername(@GetUser('username') username: string) {
 *   return { username };
 * }
 */
export const GetUser = createParamDecorator(
  <T = unknown>(data: string | undefined, ctx: ExecutionContext): T => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If data is provided, return the specified property
    // Otherwise return the entire user object
    return data ? user?.[data] : user;
  },
);
