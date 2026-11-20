import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from './generated/prisma/client.js';
import { hashPassword, verifyPassword } from './auth/password.js';
import {
  createRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from './auth/refresh-token.js';
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken } from './auth/token.js';
import { PrismaService } from './database/prisma.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Account = PublicUser & {
  password: string;
};

@Injectable()
export class AppService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(body: RegisterDto) {
    const email = body.email.toLowerCase();
    try {
      const user = await this.prisma.user.create({
        data: {
          name: body.name,
          email,
          password: await hashPassword(body.password),
        },
      });
      return this.authenticated(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(body: LoginDto) {
    const email = body.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await verifyPassword(
      body.password,
      user.password,
    );
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authenticated(user);
  }

  async refresh(refreshToken: string) {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
      include: { user: true },
    });
    if (!existing) {
      throw new UnauthorizedException('Invalid token');
    }

    const nextRefreshToken = createRefreshToken();
    await this.prisma.$transaction(async (tx) => {
      const rotated = await tx.refreshToken.updateMany({
        where: {
          id: existing.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });
      if (rotated.count !== 1) {
        throw new UnauthorizedException('Invalid token');
      }

      await tx.refreshToken.create({
        data: {
          userId: existing.user.id,
          tokenHash: hashRefreshToken(nextRefreshToken),
          expiresAt: this.refreshExpiry(),
        },
      });
    });

    return this.session(existing.user, nextRefreshToken);
  }

  async logout(refreshToken: string) {
    const revoked = await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
    if (revoked.count !== 1) {
      throw new UnauthorizedException('Invalid token');
    }

    return { message: 'Logged out' };
  }

  private async authenticated(user: Account) {
    const refreshToken = createRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: this.refreshExpiry(),
      },
    });
    return this.session(user, refreshToken);
  }

  private session(user: PublicUser, refreshToken: string) {
    return {
      user: this.toPublicUser(user),
      accessToken: signAccessToken(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        this.secret(),
      ),
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  }

  private toPublicUser(user: PublicUser): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private secret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }
}
