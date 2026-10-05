import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiException } from '../errors/api-exception';
import { TranslateAuthContext } from '../guards/translate-auth.guard';
import { SessionContext } from '../guards/clerk-auth.guard';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Honors `Idempotency-Key` on mutating authenticated routes.
 * Replays the cached JSON response for the same org + key within 24h.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<
      Request & { translateAuth?: TranslateAuthContext; sessionAuth?: SessionContext }
    >();
    const res = http.getResponse<Response>();

    if (!MUTATING.has(req.method.toUpperCase())) {
      return next.handle();
    }

    const keyHeader = req.header('idempotency-key') ?? req.header('Idempotency-Key');
    const key = keyHeader?.trim();
    if (!key) return next.handle();
    if (key.length > 256) {
      throw new ApiException(
        'validation_error',
        'Idempotency-Key must be ≤ 256 characters',
        HttpStatus.BAD_REQUEST,
      );
    }

    const organizationId =
      req.translateAuth?.organizationId ?? req.sessionAuth?.organizationId ?? null;
    if (!organizationId) return next.handle();

    const path = req.path;
    const method = req.method.toUpperCase();

    return from(
      this.prisma.idempotencyRecord.findUnique({
        where: { organizationId_key: { organizationId, key } },
      }),
    ).pipe(
      switchMap((existing) => {
        if (existing && existing.expiresAt > new Date()) {
          res.status(existing.statusCode);
          res.setHeader('X-Idempotency-Replay', 'true');
          return of(existing.responseBody);
        }
        if (existing) {
          void this.prisma.idempotencyRecord
            .delete({ where: { id: existing.id } })
            .catch(() => undefined);
        }

        return next.handle().pipe(
          tap((body) => {
            const statusCode = res.statusCode || 200;
            if (statusCode >= 500) return;
            void this.prisma.idempotencyRecord
              .upsert({
                where: { organizationId_key: { organizationId, key } },
                create: {
                  organizationId,
                  key,
                  method,
                  path,
                  statusCode,
                  responseBody: (body ?? null) as Prisma.InputJsonValue,
                  expiresAt: new Date(Date.now() + TTL_MS),
                },
                update: {
                  method,
                  path,
                  statusCode,
                  responseBody: (body ?? null) as Prisma.InputJsonValue,
                  expiresAt: new Date(Date.now() + TTL_MS),
                },
              })
              .catch(() => undefined);
          }),
        );
      }),
    );
  }
}
