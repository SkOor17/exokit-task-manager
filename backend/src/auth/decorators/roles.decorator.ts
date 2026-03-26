import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Custom decorator to specify the roles required to access a route. This decorator uses NestJS's SetMetadata to attach the roles metadata to the route handler, which can then be used by guards to enforce role-based access control.
 * @param roles - A list of roles that are allowed to access the route (e.g., ADMIN, USER). The guard will check if the authenticated user's role matches any of the specified roles before granting access.
 * @returns A decorator function that sets the 'roles' metadata for the route handler.
 */
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
