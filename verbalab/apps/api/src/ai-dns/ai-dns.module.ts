import { Module } from '@nestjs/common';
import { AiDnsController } from './ai-dns.controller';
import { AiDnsService } from './ai-dns.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiDnsController],
  providers: [AiDnsService],
  exports: [AiDnsService],
})
export class AiDnsModule {}
