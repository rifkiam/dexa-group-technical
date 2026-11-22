import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from './database/prisma.service.js';
import { CreateAttendanceDto, PaginationDto } from './dto/attendance.dto.js';
import { uploadObject } from './lib/s3.js';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadAttendancePhoto(
    userId: string,
    payload: { contentType?: string; data?: string },
  ) {
    const contentType = payload.contentType;
    if (!contentType || !['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
      throw new BadRequestException('Photo must be a JPEG, PNG, or WebP image');
    }

    const encoded = payload.data;
    if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      throw new BadRequestException('Photo data is invalid');
    }

    const image = Buffer.from(encoded, 'base64');
    if (image.length === 0 || image.length > 5 * 1024 * 1024) {
      throw new BadRequestException('Photo must be smaller than 5 MB');
    }

    const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
    const imageKey = `attendance/${userId}/${randomUUID()}.${extension}`;
    await uploadObject(imageKey, image, contentType);
    return { imageKey };
  }

  async getAttendanceList(pagination?: PaginationDto) {
    const { page = 1, limit = 10 } = pagination ?? {};
    const skip = (page - 1) * limit;
    const take = limit;

    const attendance = await this.prisma.attendance.findMany({
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: attendance,
      page,
      limit,
      total: attendance.length,
    };
  }

  async getAttendanceById(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: {
        id
      }
    });

    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }

    return attendance;
  }

  async getTodaysAttendance(userId: string) {
    const { start, end } = getJakartaDayBounds(new Date());
    const attendance = await this.prisma.attendance.findFirst({
      where: { userId, createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: 'desc' },
    });
    return { hasCheckedIn: Boolean(attendance), attendance };
  }

  async createAttendance(userId: string, email: string, employeeId: string, payload: CreateAttendanceDto) {
    const date = new Date();
    const { start, end } = getJakartaDayBounds(date);
    const existing = await this.prisma.attendance.findFirst({
      where: { userId, createdAt: { gte: start, lt: end } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('You have already recorded attendance today.');
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        userId,
        email,
        employeeId,
        imageKey: payload.imageKey,
        createdAt: date,
      },
    });
    return attendance;
  }
}

function getJakartaDayBounds(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)!.value;
  const startUtc = Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day'))) - 7 * 60 * 60 * 1000;
  return { start: new Date(startUtc), end: new Date(startUtc + 24 * 60 * 60 * 1000) };
}
