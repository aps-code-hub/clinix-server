import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const traceId =
      request.headers['x-trace-id'] ||
      request.headers['X-Trace-Id'] ||
      uuidv4();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `TraceID: ${traceId} - Status: ${httpStatus} - Error: ${JSON.stringify(
        exception instanceof Error ? exception.message : exception
      )}`
    );

    const responseBody = {
      statusCode: httpStatus,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>)?.['message'] ||
            exceptionResponse,
      error:
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as Record<string, unknown>)?.['error']
          : 'Internal error',
      path: httpAdapter.getRequestUrl(request.url),
      timestamp: new Date().toISOString(),
      traceId,
    };

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
