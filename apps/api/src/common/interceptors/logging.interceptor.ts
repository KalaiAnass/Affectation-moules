import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Structured request logging — method, path, status, duration and the
 * authenticated user (if any). Avoids logging request bodies to keep
 * potentially sensitive payloads out of the logs.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { email?: string } }>();
    const { method, originalUrl } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(method, originalUrl, context, start, req.user?.email),
        error: () => this.log(method, originalUrl, context, start, req.user?.email),
      }),
    );
  }

  private log(method: string, url: string, ctx: ExecutionContext, start: number, user?: string): void {
    const res = ctx.switchToHttp().getResponse<{ statusCode: number }>();
    const ms = Date.now() - start;
    this.logger.log(`${method} ${url} ${res.statusCode} ${ms}ms${user ? ` user=${user}` : ''}`);
  }
}
