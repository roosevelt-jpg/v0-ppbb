import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { CorporateKnowledgeSystemController } from './corporate-knowledge-system.controller';
import { CorporateKnowledgeSystemService } from './corporate-knowledge-system.service';

@Module({
  imports: [IdentityModule, VcosStoreModule],
  controllers: [CorporateKnowledgeSystemController],
  providers: [CorporateKnowledgeSystemService],
  exports: [CorporateKnowledgeSystemService],
})
export class CorporateKnowledgeSystemModule {}
