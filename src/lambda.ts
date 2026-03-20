/**
 * Serverless entry point for Vercel deployment.
 * Uses ExpressAdapter so NestJS never calls app.listen() —
 * the handler is instead exported for @vercel/node to invoke.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import type { Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalErrorFilter } from './core/errors/global-error.filter';
import { AppModule } from './app.module';

const server = express();

let isReady = false;
let bootstrapError: Error | null = null;
let bootstrapPromise: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalErrorFilter());
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('FaithCare API')
    .setDescription(
      "REST API powering Prime Church's digital care and spiritual growth platform.",
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  server.get('/api/openapi.json', (_req: Request, res: Response) => res.json(document));
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.init();
  isReady = true;
}

// Kick off bootstrap immediately so the first cold-start request
// doesn't wait from scratch on every invocation.
bootstrapPromise = bootstrap().catch((err: Error) => {
  console.error('[Lambda] Bootstrap failed:', err);
  bootstrapError = err;
});

export default async (req: Request, res: Response): Promise<void> => {
  if (!isReady) {
    await bootstrapPromise;
  }

  if (bootstrapError) {
    res.status(500).json({
      statusCode: 500,
      message: 'Service failed to initialize. Check server logs.',
    });
    return;
  }

  server(req, res);
};
