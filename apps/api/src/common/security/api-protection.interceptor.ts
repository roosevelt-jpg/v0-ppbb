import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Observable, tap } from 'rxjs';
import { getHttpPair } from '../http/execution-request';

/**
 * Trademark + anti-clone response hardening for all API responses.
 * Ownership headers + response fingerprint watermark (headers only — body shape preserved).
 */
@Injectable()
export class ApiProtectionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { req, res } = getHttpPair(context);
    const requestId =
      (typeof req?.headers?.['x-request-id'] === 'string' && req.headers['x-request-id']) ||
      createHash('sha256')
        .update(`${Date.now()}:${Math.random()}`)
        .digest('hex')
        .slice(0, 16);

    if (res && typeof res.setHeader === 'function') {
      // Header values must be ASCII (Node rejects (R)/emdash/smart quotes).
      res.setHeader('X-VerbaLab-Product', 'VerbaLab Language Intelligence Platform');
      res.setHeader(
        'X-VerbaLab-Trademark',
        "VerbaLab (R) - Africa's language AI. Unauthorized cloning prohibited.",
      );
      res.setHeader('X-VerbaLab-License', 'Proprietary - see /docs and platform terms');
      res.setHeader('X-VerbaLab-Request-Id', requestId);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      res.setHeader('Cache-Control', 'private, no-store');
    }

    return next.handle().pipe(
      tap((body) => {
        if (!(res && typeof res.setHeader === 'function')) return;
        let fingerprint = requestId;
        try {
          fingerprint = createHash('sha256')
            .update(typeof body === 'string' ? body : JSON.stringify(body ?? null))
            .update(requestId)
            .digest('hex')
            .slice(0, 24);
        } catch {
          /* binary / circular — keep requestId */
        }
        res.setHeader('X-VerbaLab-Watermark', `vl:${requestId}:${fingerprint}`);
      }),
    );
  }
}
