import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from './database/prisma.service.js';
import { CreateAttendanceDto } from './dto/attendance.dto.js';
import { uploadObject } from './lib/s3.js';

type Pagination = {
  page: number;
  limit: number;
}

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

  async getAttendanceList(pagination?: Pagination) {
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

  async createAttendance(userId: string, email: string, employeeId: string, payload: CreateAttendanceDto) {
    const date = new Date();
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
