import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiComplianceFrameworkModule } from '../ai-compliance-framework.module';
import { AI_COMPLIANCE_FRAMEWORK_CATALOG_PORT } from './ports';
import { NestAiComplianceFrameworkCatalogAdapter } from './nest-ai-compliance-framework.adapter';
import { AI_COMPLIANCE_FRAMEWORK_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AiComplianceFrameworkModule],
  providers: [
    NestAiComplianceFrameworkCatalogAdapter,
    { provide: AI_COMPLIANCE_FRAMEWORK_CATALOG_PORT, useExisting: NestAiComplianceFrameworkCatalogAdapter },
    ...AI_COMPLIANCE_FRAMEWORK_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AiComplianceFrameworkApplicationModule {}
