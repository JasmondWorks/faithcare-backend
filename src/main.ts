import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalErrorFilter } from './core/errors/global-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalErrorFilter());
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });

  // ── OpenAPI / Swagger ──────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('FaithCare API')
    .setDescription(
      "REST API powering Prime Church's digital care and spiritual growth platform. " +
      'ChurchCare handles first-timer follow-up; the Journal and Scripture modules keep ' +
      'young professionals spiritually grounded.',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'Admin and user login, Google OAuth 2.0, token refresh')
    .addTag('ChurchCare — First Timers', 'QR code registration, visitor records, follow-up status')
    .addTag('ChurchCare — Follow-Up', 'Message templates, delivery logs, manual messaging triggers')
    .addTag('ChurchCare — Dashboard', 'Aggregate metrics and weekly trend data')
    .addTag('Journal', 'Full CRUD for sermon and devotional journal entries')
    .addTag('Scripture', 'One scripture per day with encouragement and reminder preferences')
    .addTag('Focus Timer', '25-minute Pomodoro-style sessions with scripture reward on completion')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    .setContact('FaithCare', 'https://faithcare-zeta.vercel.app/', '')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // ── Swagger UI at /api/docs ────────────────────────────────────
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.31.0/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5.31.0/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5.31.0/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\nFaithCare API running on: http://localhost:${port}`);
  console.log(`API Docs (Swagger UI):    http://localhost:${port}/api/docs`);
  console.log(`OpenAPI JSON:             http://localhost:${port}/api/docs-json\n`);
}
bootstrap();
