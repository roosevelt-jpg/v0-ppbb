import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EnterpriseArchitectureRepositoryModule } from '../enterprise-architecture-repository.module';
import { ENTERPRISE_ARCHITECTURE_REPOSITORY_CATALOG_PORT } from './ports';
import { NestEnterpriseArchitectureRepositoryCatalogAdapter } from './nest-enterprise-architecture-repository.adapter';
import { ENTERPRISE_ARCHITECTURE_REPOSITORY_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EnterpriseArchitectureRepositoryModule],
  providers: [
    NestEnterpriseArchitectureRepositoryCatalogAdapter,
    { provide: ENTERPRISE_ARCHITECTURE_REPOSITORY_CATALOG_PORT, useExisting: NestEnterpriseArchitectureRepositoryCatalogAdapter },
    ...ENTERPRISE_ARCHITECTURE_REPOSITORY_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EnterpriseArchitectureRepositoryApplicationModule {}
