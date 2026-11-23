import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { CreateUserDto, LoginDto, UpdateUserDto } from './dto/auth.dto.js';
import { AdminGuard, getAdminId, type AdminRequest } from './auth/admin.guard.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return "Welcome to the login API";
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.appService.login(body);
  }

  @Get('users')
  @UseGuards(AdminGuard)
  listUsers() {
    return this.appService.listUsers();
  }

  @Post('users')
  @UseGuards(AdminGuard)
  createUser(@Body() body: CreateUserDto) {
    return this.appService.createUser(body);
  }

  @Put('users/:id')
  @UseGuards(AdminGuard)
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto, @Req() req: AdminRequest) {
    return this.appService.updateUser(id, body, getAdminId(req));
  }

  @Delete('users/:id')
  @UseGuards(AdminGuard)
  deleteUser(@Param('id') id: string, @Req() req: AdminRequest) {
    return this.appService.deleteUser(id, getAdminId(req));
  }
}
