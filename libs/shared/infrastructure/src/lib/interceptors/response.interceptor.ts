import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  traceId: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((data) => ({
        statusCode,
        message: 'Success',
        data: data || null,
        timestamp: new Date().toISOString(),
        traceId:
          request.headers['x-trace-id'] ||
          request.headers['X-Trace-Id'] ||
          uuidv4(),
      }))
    );
  }
}
