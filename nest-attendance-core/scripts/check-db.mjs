import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/database/prisma.service.js';

const app = await NestFactory.createApplicationContext(AppModule);
const prisma = app.get(PrismaService);
const rows = await prisma.$queryRaw`SELECT DATABASE() AS db, 1 AS ok`;
console.log(rows);
await app.close();
