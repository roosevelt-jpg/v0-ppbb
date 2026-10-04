import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { NationalAiPlatformController } from './national-ai-platform.controller';
import { NationalAiPlatformService } from './national-ai-platform.service';

@Module({
  imports: [IdentityModule, DcivStoreModule],
  controllers: [NationalAiPlatformController],
  providers: [NationalAiPlatformService],
  exports: [NationalAiPlatformService],
})
export class NationalAiPlatformModule {}
