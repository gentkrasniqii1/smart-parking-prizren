import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // E aktivizuar gjithmonë (jo vetëm dev) — projekt portofoli, dokumentimi i
  // API-t është pjesë e dorëzimit, jo sekret prodhimi.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smart Parking Prizren API')
    .setDescription(
      'REST API për platformën e parkimit inteligjent në Prizren — zona/spote (PostGIS), rezervime, check-in/out, njoftime live (WebSocket), analitika admin.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
