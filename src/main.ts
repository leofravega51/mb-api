import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  const rootDomain = config.get<string>('ROOT_DOMAIN', 'localhost');
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (origin === corsOrigin || origin.startsWith(`${corsOrigin}/`)) {
        callback(null, true);
        return;
      }
      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        if (rootDomain === 'localhost') {
          if (hostname.endsWith('.localhost')) {
            callback(null, true);
            return;
          }
        } else if (hostname === rootDomain || hostname.endsWith(`.${rootDomain}`)) {
          callback(null, true);
          return;
        }
      } catch {
        // ignore invalid origin
      }
      callback(null, false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`mb-api listening on http://localhost:${port}/api`);
}

bootstrap();
