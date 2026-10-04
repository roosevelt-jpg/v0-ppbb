import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalAiStandardsModule } from '../global-ai-standards.module';
import { GLOBAL_AI_STANDARDS_CATALOG_PORT } from './ports';
import { NestGlobalAiStandardsCatalogAdapter } from './nest-global-ai-standards.adapter';
import { GLOBAL_AI_STANDARDS_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GlobalAiStandardsModule],
  providers: [
    NestGlobalAiStandardsCatalogAdapter,
    { provide: GLOBAL_AI_STANDARDS_CATALOG_PORT, useExisting: NestGlobalAiStandardsCatalogAdapter },
    ...GLOBAL_AI_STANDARDS_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GlobalAiStandardsApplicationModule {}
