import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // `FRONTEND_URL` (opsionale, e ndarë me presje për shumë origjina — p.sh.
  // domain prodhimi + preview URLs) kufizon CORS në prodhim; pa të, `true`
  // pasqyron çdo origjinë (i përshtatshëm vetëm për dev lokal).
  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({
    origin: frontendUrl ? frontendUrl.split(',').map((url) => url.trim()) : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
