import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        // If the handler already returns an envelope, pass through
        if (data !== null && typeof data === 'object' && 'success' in (data as object)) {
          return data as ResponseEnvelope<T>;
        }
        return { success: true, data: data as T };
      }),
    );
  }
}
