import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './database/prisma.service.js';
import { CreateAttendanceDto } from './dto/attendance.dto.js';

type Pagination = {
  page: number;
  limit: number;
}

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

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

  async createAttendance(userId: string, email: string, payload: CreateAttendanceDto) {
    const date = new Date();
    const attendance = await this.prisma.attendance.create({
      data: {
        userId,
        email,
        imageKey: payload.imageKey,
        createdAt: date,
      },
    });
    return attendance;
  }
}
