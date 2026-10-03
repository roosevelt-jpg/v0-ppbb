import { Module } from '@nestjs/common';
import { AiCertificateAuthorityController } from './ai-certificate-authority.controller';
import { AiCertificateAuthorityService } from './ai-certificate-authority.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiCertificateAuthorityController],
  providers: [AiCertificateAuthorityService],
  exports: [AiCertificateAuthorityService],
})
export class AiCertificateAuthorityModule {}
