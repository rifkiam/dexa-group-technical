import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return "Welcome to the login API";
  }

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.appService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.appService.login(body);
  }
}
