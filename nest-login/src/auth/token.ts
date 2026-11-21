import jwt from 'jsonwebtoken';

export const ACCESS_TOKEN_TTL = '15m';
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
  employeeId: string;
};

export function signAccessToken(
  payload: AccessTokenPayload,
  secret: string,
): string {
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(
  token: string,
  secret: string,
): AccessTokenPayload {
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
