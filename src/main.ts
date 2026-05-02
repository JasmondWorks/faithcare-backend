console.log('main.ts module evaluation started');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalErrorFilter } from './core/errors/global-error.filter';
import cookieParser from 'cookie-parser';
import envConfig from './config/env.config';

async function bootstrap() {
  console.log('Bootstrapping application...');
  const app = await NestFactory.create(AppModule);
  console.log('App created.');

  app.use(cookieParser());

  app.enableCors({
    origin: (
      _origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Reflect any origin back — never returns '*', satisfying the CORS spec
      // requirement that credentialed requests cannot use a wildcard origin.
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalErrorFilter());
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });

  // ── OpenAPI / Swagger ──────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('FaithCare API')
    .setDescription(
      'REST API powering FaithCare — a digital pastoral care and spiritual growth platform.\n\n' +
        '**ChurchCare** (org-side): first-timer/second-timer registration via QR, follow-up tracking, ' +
        'WhatsApp & bulk SMS messaging, customisable message templates (+ system presets), ' +
        'dashboard analytics, communities, salvation records, and prayer requests.\n\n' +
        '**Spiritual Growth** (user-side): daily journal entries, verse of the day (auto-fetched from Bible API), ' +
        'per-user daily scriptures, and Pomodoro-style focus timer with scripture rewards.\n\n' +
        '**Real-time**: WebSocket notifications at `/notifications` (Socket.io) — ' +
        'join room `org:<id>` to receive `first_timer_registered`, `follow_up_due`, `message_sent` events.',
    )
    .setVersion('2.0')
    .addTag(
      'Authentication',
      'Registration, login, Google OAuth, OTP verification, password reset, token refresh, logout, super-admin invite',
    )
    .addTag(
      'Users',
      'User profile management (admin CRUD + self GET /users/me)',
    )
    .addTag(
      'Organization',
      'Create and manage church organizations; QR code regeneration',
    )
    .addTag(
      'Organization — Members',
      'Regular church members (beyond first/second visit); targets for follow-up tasks',
    )
    .addTag(
      'Organization — Communities',
      'Community groups within an org; admin-managed member lists',
    )
    .addTag(
      'ChurchCare — First Timers',
      'QR-code visitor registration, follow-up status tracking',
    )
    .addTag(
      'ChurchCare — Second Timers',
      'Second-visit records linked to a first-timer; managed per organization',
    )
    .addTag(
      'ChurchCare — Follow-Up',
      'Follow-up tasks for first-timers, members, or any contact; supports WhatsApp & SMS messaging',
    )
    .addTag(
      'Admin Applications',
      'Admin org-join applications: submit, review, approve/reject; auto-deleted after 30 days',
    )
    .addTag(
      'ChurchCare — Dashboard',
      'Aggregate metrics and weekly trend charts for org admins',
    )
    .addTag(
      'Message Templates',
      'Custom org message templates (fully editable) + system preset templates for WhatsApp & SMS',
    )
    .addTag(
      'Journal',
      'Full CRUD for personal sermon and devotional journal entries',
    )
    .addTag(
      'Scripture',
      'Global verse of the day (Bible API) and per-user daily scripture entries',
    )
    .addTag(
      'Focus Timer',
      '25-minute Pomodoro sessions with scripture reward on completion',
    )
    .addTag(
      'Prime Church',
      'Workforce applications, Trybe membership, and prayer requests',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    .setContact('FaithCare', envConfig().platformUrl, '')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // ── Swagger UI at /api/v1/docs ────────────────────────────────────
  SwaggerModule.setup('api/v1/docs', app, document, {
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
  console.log(`API Docs (Swagger UI):    http://localhost:${port}/api/v1/docs`);
  console.log(
    `OpenAPI JSON:             http://localhost:${port}/api/v1/docs-json\n`,
  );
}
void bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
