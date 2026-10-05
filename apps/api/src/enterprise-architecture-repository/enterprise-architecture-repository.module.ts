import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { EnterpriseArchitectureRepositoryController } from './enterprise-architecture-repository.controller';
import { EnterpriseArchitectureRepositoryService } from './enterprise-architecture-repository.service';

@Module({
  imports: [IdentityModule, VcosStoreModule],
  controllers: [EnterpriseArchitectureRepositoryController],
  providers: [EnterpriseArchitectureRepositoryService],
  exports: [EnterpriseArchitectureRepositoryService],
})
export class EnterpriseArchitectureRepositoryModule {}
