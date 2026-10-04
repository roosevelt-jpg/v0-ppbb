import { Module } from '@nestjs/common';
import { VoiceBridgesController } from './voice-bridges.controller';
import { VoiceBridgesService } from './voice-bridges.service';
import { VoiceBridgesVapiSttGateway } from './voice-bridges.vapi-stt';
import { AudioModule } from '../audio/audio.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    AudioModule,
    GatewayModule,
    ApiKeysModule,
    PrismaModule,
    IdentityModule,
    RateLimitModule,
  ],
  controllers: [VoiceBridgesController],
  providers: [VoiceBridgesService, VoiceBridgesVapiSttGateway, TranslateAuthGuard],
  exports: [VoiceBridgesService],
})
export class VoiceBridgesModule {}
