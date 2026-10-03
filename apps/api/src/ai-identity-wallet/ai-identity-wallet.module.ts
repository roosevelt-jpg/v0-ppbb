import { Module } from '@nestjs/common';
import { AiIdentityWalletController } from './ai-identity-wallet.controller';
import { AiIdentityWalletService } from './ai-identity-wallet.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiIdentityWalletController],
  providers: [AiIdentityWalletService],
  exports: [AiIdentityWalletService],
})
export class AiIdentityWalletModule {}
