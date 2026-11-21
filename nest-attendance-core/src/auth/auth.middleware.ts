import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

export type AuthenticatedRequest = {
  headers: { authorization?: string | string[] };
  user?: { id: string; email: string; role: string; employeeId: string };
};

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
  employeeId: string;
};

const ACCESS_TOKEN_TTL = '15m';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: AuthenticatedRequest, _res: unknown, next: () => void) {
    const token = readBearer(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    let decoded: AccessTokenPayload;
    try {
      decoded = verify(token, this.config.getOrThrow<string>('JWT_SECRET'));
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role, employeeId: decoded.employeeId };
    next();
  }
}

function readBearer(
  authorization: string | string[] | undefined,
): string | undefined {
  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!value) {
    return undefined;
  }

  const [scheme, token] = value.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return undefined;
  }

  return token;
}

function verify(token: string, secret: string): AccessTokenPayload {
  const decoded = jwt.verify(token, secret, { maxAge: ACCESS_TOKEN_TTL });
  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.email !== 'string' ||
    typeof decoded.role !== 'string' ||
    typeof decoded.employeeId !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    employeeId: decoded.employeeId,
  };
}
