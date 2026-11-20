import { Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AppService } from './app.service.js';
import { CreateAttendanceDto, PaginationDto } from './dto/attendance.dto.js';
import { AuthGuard } from './auth/auth.guard.js';
import type { AuthenticatedRequest } from './auth/auth.middleware.js';
import { Roles } from './auth/roles.decorator.js';
import { RolesGuard } from './auth/roles.guard.js';
import { Role } from './auth/roles.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return "Welcome to the attendance core API";
  }

  @Get('attendance')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  getAttendanceList(@Query() query: PaginationDto) {
    return this.appService.getAttendanceList(query);
  }

  @Get('attendance/:id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  getAttendanceById(@Param('id') id: string) {
    return this.appService.getAttendanceById(id);
  }

  @Post('attendance')
  @UseGuards(AuthGuard)
  createAttendance(@Req() req: AuthenticatedRequest, @Body() body: CreateAttendanceDto) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.appService.createAttendance(user.id, user.email, body);
  }
}
