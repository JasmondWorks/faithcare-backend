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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');

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
      "REST API powering Prime Church's digital care and spiritual growth platform. " +
        'ChurchCare handles first-timer follow-up; the Journal and Scripture modules keep ' +
        'young professionals spiritually grounded.',
    )
    .setVersion('1.0')
    .addTag(
      'Authentication',
      'Login (role determines access level), registration, email OTP verification, token refresh, org context switch',
    )
    .addTag(
      'ChurchCare — First Timers',
      'QR code registration, visitor records, follow-up status',
    )
    .addTag(
      'ChurchCare — Follow-Up',
      'Message templates, delivery logs, manual messaging triggers',
    )
    .addTag('ChurchCare — Dashboard', 'Aggregate metrics and weekly trend data')
    .addTag('Journal', 'Full CRUD for sermon and devotional journal entries')
    .addTag(
      'Scripture',
      'One scripture per day with encouragement and reminder preferences',
    )
    .addTag(
      'Focus Timer',
      '25-minute Pomodoro-style sessions with scripture reward on completion',
    )
    .addTag(
      'Prime Church',
      'Workforce applications, Trybe membership, and prayer requests for Prime Church',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    .setContact('FaithCare', 'https://faithcare-zeta.vercel.app/', '')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve raw OpenAPI JSON
  adapter.get('/api/v1/openapi.json', (_req: any, res: any) =>
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
