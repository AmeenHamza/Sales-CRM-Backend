import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
dotenv.config();

async function bootstrap() {
  // main.ts
 const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  app.enableCors({
    // 1. MUST be the specific URL of your frontend (No wildcard '*')
    origin: 'http://localhost:5173', 
    
    // 2. MUST be true because your frontend is sending credentials
    credentials: true, 
    
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // strips unknown properties
    forbidNonWhitelisted: true, // throw error if unknown props sent
    transform: true, // automatically transform payloads into DTO instances
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
