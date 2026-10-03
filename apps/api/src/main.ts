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
  const corsOrigin = corsOriginEnv.includes(',')
    ? corsOriginEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : corsOriginEnv;
  app.enableCors({ origin: corsOrigin });

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  structuredLog.info('api.started', {
    event: 'api.started',
    port,
    sentry: sentryOn,
  });
}

void bootstrap();
