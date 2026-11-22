import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Response } from './response.interceptor.js';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const rawMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'message' in exceptionResponse
          ? exceptionResponse.message
          : exception instanceof Error
            ? exception.message
            : 'Internal server error';
    const message = Array.isArray(rawMessage)
      ? rawMessage.map(String).join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : 'Request failed';
    const error =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'error' in exceptionResponse &&
      typeof exceptionResponse.error === 'string'
        ? exceptionResponse.error
        : statusCode >= 500
          ? 'Internal Server Error'
          : 'Request Error';

    httpAdapter.reply(
      context.getResponse(),
      { statusCode, message, error } satisfies Response<never>,
      statusCode,
    );
  }
}
