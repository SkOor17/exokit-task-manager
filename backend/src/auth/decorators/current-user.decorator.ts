import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client'; // Importez votre type/modèle utilisateur

export interface RequestWithUser {
  user: User;
}

/**
 * Custom decorator to extract the current authenticated user from the request object. This decorator can be used in controller methods to easily access the user's information without having to manually extract it from the request.
 * @param data - Optional parameter to specify a specific property of the user to return (e.g., 'email', 'id'). If not provided, the entire user object will be returned.
 * @param ctx - The execution context of the request, which allows access to the request object.
 * @returns The current authenticated user or a specific property of the user if requested.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    const user = request.user;

    // If a specific property is requested, return that property, otherwise return the whole user object
    return data ? user[data] : user;
  },
);
