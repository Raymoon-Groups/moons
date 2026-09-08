import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { existsSync, mkdirSync } from 'fs';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { MulterExceptionFilter } from './common/filters/multer-exception.filter';
import { csrfCookieProtection } from './common/middleware/csrf-cookie.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  // Files are served via authenticated GET /api/v1/media/:category/:filename
  // (see FilesModule). Do not expose /uploads as public static assets.

  app.setGlobalPrefix('api/v1');
  app.use(
    helmet({
      // API serves JSON / binary media; CSP is enforced on the Next.js web app.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      referrerPolicy: { policy: 'no-referrer' },
      hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    }),
  );
  app.use(cookieParser());
  app.use(csrfCookieProtection);
  app.useGlobalFilters(new MulterExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const corsOrigins = new Set(
    [
      ...(process.env.CORS_ORIGIN ?? 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      // Expo mobile web preview (pnpm mobile / expo start --web)
      'http://localhost:8081',
      'http://127.0.0.1:8081',
    ],
  );

  /** Dev: allow Expo/web on LAN IPs (health works in a tab, but fetch needs CORS). */
  function isLocalDevOrigin(origin: string): boolean {
    try {
      const { hostname, protocol } = new URL(origin);
      if (protocol !== 'http:' && protocol !== 'https:') return false;
      if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
      // Private LAN ranges used by Expo --lan / physical devices
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
      if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
      if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
      return false;
    } catch {
      return false;
    }
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Non-browser clients (mobile native, curl) send no Origin
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.has(origin) || (!isProd && isLocalDevOrigin(origin))) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    exposedHeaders: ['X-CSRF-Token'],
  });

  const enableSwagger =
    process.env.ENABLE_SWAGGER === 'true' || (!isProd && process.env.ENABLE_SWAGGER !== 'false');

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Moons API')
      .setDescription('Professional network + job portal API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://0.0.0.0:${port}`);
  if (enableSwagger) {
    console.log(`Swagger docs at /api/docs`);
  } else {
    console.log('Swagger docs disabled in this environment');
  }
}

bootstrap();
