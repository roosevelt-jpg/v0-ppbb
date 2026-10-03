import { Module } from '@nestjs/common';
import { A2aProtocolController } from './a2a-protocol.controller';
import { A2aProtocolService } from './a2a-protocol.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [A2aProtocolController],
  providers: [A2aProtocolService],
  exports: [A2aProtocolService],
})
export class A2aProtocolModule {}
