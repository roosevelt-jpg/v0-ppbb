import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';

/** Baseline HTTP security headers for the API (no CSP — JSON API). */
export function applyHttpSecurity(app: INestApplication) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hidePoweredBy: true,
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-VerbaLab-Owned-By', 'VerbaLab');
    res.setHeader(
      'X-VerbaLab-Anti-Clone',
      'Responses are watermarked. Impersonating VerbaLab APIs or brands is prohibited.',
    );
    // Block obvious clone probes that hammer OpenAPI mirrors without auth
    if (
      req.method === 'GET' &&
      (req.path === '/v1/openapi.json' || req.path === '/openapi.json') &&
      process.env.VERBALAB_LOCK_OPENAPI === '1' &&
      !req.headers.authorization
    ) {
      res.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'OpenAPI download requires authentication when lock is enabled.',
        },
      });
      return;
    }
    next();
  });
}
