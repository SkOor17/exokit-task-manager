import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, User } from '@prisma/client';

export interface AuthenticatedRequest {
  user: User;
}

/**
 * Guard that implements role-based access control.
 * This guard checks if the authenticated user's role matches any of the roles required by the route handler, which are specified using the @Roles() decorator.
 * If the user has one of the required roles, access to the route is granted; otherwise, access is denied.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get the user from the request
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // If there's no user, deny access
    if (!user) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
