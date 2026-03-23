import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that implements JWT authentication strategy.
 * This guard extends NestJS's built-in AuthGuard and specifies 'jwt' as the strategy to be used for authentication.
 * It will validate incoming requests by checking for a valid JWT token in the Authorization header and will allow access to protected routes if the token is valid.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
