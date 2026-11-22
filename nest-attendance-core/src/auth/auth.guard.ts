import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { getAuthenticatedUser, type AuthenticatedRequest } from './auth.middleware.js';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!getAuthenticatedUser(request)) {
      throw new UnauthorizedException('User not authenticated');
    }

    return true;
  }
}
