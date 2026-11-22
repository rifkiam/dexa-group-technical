import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from './generated/prisma/client.js';
import { hashPassword, verifyPassword } from './auth/password.js';
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken } from './auth/token.js';
import { PrismaService } from './database/prisma.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId: string;
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
          employeeId: body.employeeId,
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

  private authenticated(user: Account) {
    return this.session(user);
  }

  private session(user: PublicUser) {
    return {
      user: this.toPublicUser(user),
      accessToken: signAccessToken(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
        },
        this.secret(),
      ),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  private toPublicUser(user: PublicUser): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };
  }

  private secret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }
}
