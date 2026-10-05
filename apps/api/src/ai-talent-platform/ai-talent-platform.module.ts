import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { AiTalentPlatformController } from './ai-talent-platform.controller';
import { AiTalentPlatformService } from './ai-talent-platform.service';

@Module({
  imports: [IdentityModule, AieStoreModule],
  controllers: [AiTalentPlatformController],
  providers: [AiTalentPlatformService],
  exports: [AiTalentPlatformService],
})
export class AiTalentPlatformModule {}
