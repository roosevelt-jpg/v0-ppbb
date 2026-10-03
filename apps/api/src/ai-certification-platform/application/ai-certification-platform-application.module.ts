import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiCertificationPlatformModule } from '../ai-certification-platform.module';
import { AI_CERTIFICATION_PLATFORM_CATALOG_PORT } from './ports';
import { NestAiCertificationPlatformCatalogAdapter } from './nest-ai-certification-platform.adapter';
import { AI_CERTIFICATION_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiCertificationPlatformModule],
  providers: [
    NestAiCertificationPlatformCatalogAdapter,
    { provide: AI_CERTIFICATION_PLATFORM_CATALOG_PORT, useExisting: NestAiCertificationPlatformCatalogAdapter },
    ...AI_CERTIFICATION_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiCertificationPlatformApplicationModule {}
