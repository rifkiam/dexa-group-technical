import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getAuthenticatedUser, type AuthenticatedRequest } from './auth.middleware.js';
import { ROLES_KEY } from './roles.decorator.js';
import type { Role } from './roles.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = getAuthenticatedUser(request);
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!roles.includes(user.role as Role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
