import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { HidePhaseIdsInterceptor } from './common/hide-phase-ids.interceptor';
import { initApiSentry } from './observability/sentry';
import { structuredLog } from './common/logging/structured-logger';
import { applyHttpSecurity } from './common/security/http-security';

async function bootstrap() {
  const sentryOn = initApiSentry();
  const app = await NestFactory.create(AppModule, { rawBody: true });
  applyHttpSecurity(app);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new HidePhaseIdsInterceptor());

  const corsOriginEnv =
    process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://127.0.0.1:3000';
  const corsOrigins = corsOriginEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowQuickTunnels =
    process.env.CLERK_SECRET_KEY?.startsWith('sk_test_') ||
    process.env.ALLOW_QUICK_TUNNEL_CORS === '1';
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (
        allowQuickTunnels &&
        (/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin) ||
          /^https:\/\/[a-z0-9-]+\.loca\.lt$/i.test(origin))
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  });

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  structuredLog.info('api.started', {
    event: 'api.started',
    port,
    sentry: sentryOn,
  });
}

void bootstrap();
