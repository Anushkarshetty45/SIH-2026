import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '');
  app.enableCors({
    origin: corsOrigins ? corsOrigins.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger (non-production only in this foundation; adjust as needed)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Rural Healthcare Coordination Platform API')
      .setDescription('REST API for the Rural Healthcare Coordination Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  await app.listen(port);
  console.log(`[RHCP] API running on http://localhost:${port}`);
  console.log(`[RHCP] Swagger at  http://localhost:${port}/api/v1/docs`);
}

bootstrap();
