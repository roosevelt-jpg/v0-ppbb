import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CorporateKnowledgeSystemModule } from '../corporate-knowledge-system.module';
import { CORPORATE_KNOWLEDGE_SYSTEM_CATALOG_PORT } from './ports';
import { NestCorporateKnowledgeSystemCatalogAdapter } from './nest-corporate-knowledge-system.adapter';
import { CORPORATE_KNOWLEDGE_SYSTEM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, CorporateKnowledgeSystemModule],
  providers: [
    NestCorporateKnowledgeSystemCatalogAdapter,
    { provide: CORPORATE_KNOWLEDGE_SYSTEM_CATALOG_PORT, useExisting: NestCorporateKnowledgeSystemCatalogAdapter },
    ...CORPORATE_KNOWLEDGE_SYSTEM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class CorporateKnowledgeSystemApplicationModule {}
