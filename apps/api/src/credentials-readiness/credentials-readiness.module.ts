import { Module } from '@nestjs/common';
import { CredentialsReadinessController } from './credentials-readiness.controller';
import { CredentialsReadinessService } from './credentials-readiness.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [CredentialsReadinessController],
  providers: [CredentialsReadinessService],
  exports: [CredentialsReadinessService],
})
export class CredentialsReadinessModule {}
