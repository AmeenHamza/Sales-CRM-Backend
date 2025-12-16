import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // strips unknown properties
    forbidNonWhitelisted: true, // throw error if unknown props sent
    transform: true, // automatically transform payloads into DTO instances
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
