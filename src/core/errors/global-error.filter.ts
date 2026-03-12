import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception.statusCode || 500;

    response.status(status).json({
      message: exception.message || 'Internal Server Error',
    });
  }
}
