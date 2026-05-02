/**
 * Serverless entry point for Vercel deployment.
 * Uses NestJS's own ExpressAdapter (Express v5) — no custom express instance.
 * The handler is exported for @vercel/node to invoke.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalErrorFilter } from './core/errors/global-error.filter';
import { AppModule } from './app.module';
import type { IncomingMessage, ServerResponse } from 'http';
import { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import envConfig from './config/env.config';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let handler: Handler | null = null;
let bootstrapError: Error | null = null;
let bootstrapPromise: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const adapter = new ExpressAdapter();
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn'],
  });

  app.use(cookieParser());
  app.enableCors({
    origin: (
      _origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      callback(null, true); // reflect request origin — never returns '*'
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalErrorFilter());
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });

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

  // Serve raw OpenAPI JSON
  adapter.get('/api/v1/openapi.json', (_req: Request, res: Response) =>
    res.json(document),
  );

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

  await app.init();
  handler = adapter.getInstance();
}

// Start bootstrap immediately so the first cold-start doesn't wait from scratch.
bootstrapPromise = bootstrap().catch((err: Error) => {
  console.error('[Lambda] Bootstrap failed:', err);
  bootstrapError = err;
});

export default async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  if (handler === null) {
    await bootstrapPromise;
  }

  if (bootstrapError || handler === null) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        statusCode: 500,
        message: 'Service failed to initialize. Check server logs.',
      }),
    );
    return;
  }

  handler(req, res);
};
