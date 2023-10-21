import { HttpException, HttpExceptionOptions } from '@nestjs/common';

export class CommunicationException extends HttpException {
  constructor(
    response: string | Record<string, unknown>,
    status: number,
    options?: HttpExceptionOptions,
  ) {
    super(response, status, options);
  }
}
