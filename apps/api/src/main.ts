import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  const isProd = process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT ?? '3001', 10);
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // --- Security headers (OWASP) ---
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          // Swagger UI needs inline styles
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // --- Validation: reject unknown fields, coerce types ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  // --- OpenAPI / Swagger ---
  const config = new DocumentBuilder()
    .setTitle('Mold-to-Press Compatibility API')
    .setDescription(
      'Determines whether a plastic injection mold can be mounted on a given press. ' +
        'Forvia Hénin-Beaumont. All compatibility decisions are fully explainable per rule.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('compatibility', 'Compatibility checks, matrix and reverse search')
    .addTag('presses', 'Press reference data')
    .addTag('molds', 'Mold reference data')
    .addTag('audit', 'Audit history')
    .addTag('auth', 'Authentication')
    .addTag('health', 'Liveness / readiness')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api (docs at /api/docs)`);
}

void bootstrap();
