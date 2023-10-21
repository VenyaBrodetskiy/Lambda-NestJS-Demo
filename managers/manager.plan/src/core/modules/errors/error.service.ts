import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Configuration } from 'src/config';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  constructor(private readonly config: Configuration) {}
  private readonly logger = new Logger(HttpErrorFilter.name);
  public catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request: Request = ctx.getRequest();
    const response: Response = ctx.getResponse();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    const devErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception?.message,
      callstack: exception.stack,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      innerError: (exception as any)?.response,
    };

    const prodErrorResponse = {
      statusCode,
      message,
    };

    this.logger.error(
      `request method: ${request.method} request url${request.url}`,
      JSON.stringify(devErrorResponse, null, ' '),
    );
    response.status(statusCode).json(this.config.IsOffline ? devErrorResponse : prodErrorResponse);
  }
}
