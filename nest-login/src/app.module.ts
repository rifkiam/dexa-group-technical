import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './database/prisma.module.js';
import { ResponseExceptionFilter } from './common/response-exception.filter.js';
import { ResponseInterceptor } from './common/response.interceptor.js';
import { AdminGuard } from './auth/admin.guard.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [AppController],
  providers: [
    AppService,
    AdminGuard,
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: ResponseExceptionFilter },
  ],
})
export class AppModule {}
