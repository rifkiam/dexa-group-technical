import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from './generated/prisma/client.js';
import { hashPassword, verifyPassword } from './auth/password.js';
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken } from './auth/token.js';
import { PrismaService } from './database/prisma.service.js';
import { CreateUserDto, LoginDto, UpdateUserDto } from './dto/auth.dto.js';

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

  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true, email: true, employeeId: true, role: true, createdAt: true, updatedAt: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
    return users;
  }

  async createUser(body: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          name: body.name,
          email: body.email.toLowerCase(),
          employeeId: body.employeeId,
          password: await hashPassword(body.password),
          role: body.role ?? 'user',
        },
        select: { id: true, name: true, email: true, employeeId: true, role: true, createdAt: true, updatedAt: true },
      });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }

  async updateUser(id: string, body: UpdateUserDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');
    if (id === actorId && body.role && body.role !== 'admin') {
      throw new ForbiddenException('You cannot remove your own admin role');
    }
    if (existing.role === 'admin' && body.role === 'user') {
      const adminCount = await this.prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) throw new ForbiddenException('The last admin cannot be demoted');
    }

    const data: Prisma.UserUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email.toLowerCase();
    if (body.employeeId !== undefined) data.employeeId = body.employeeId;
    if (body.role !== undefined) data.role = body.role;
    if (body.password) data.password = await hashPassword(body.password);

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, employeeId: true, role: true, createdAt: true, updatedAt: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }

  async deleteUser(id: string, actorId: string) {
    if (id === actorId) throw new ForbiddenException('You cannot delete your own account');
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');
    if (existing.role === 'admin') {
      const adminCount = await this.prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) throw new ForbiddenException('The last admin cannot be deleted');
    }
    await this.prisma.user.delete({ where: { id } });
    return { id };
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
