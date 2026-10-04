import { Module } from '@nestjs/common';
import { VideoVoiceController } from './video-voice.controller';
import { VideoVoiceService } from './video-voice.service';
import { IdentityModule } from '../identity/identity.module';
import { GatewayModule } from '../gateway/gateway.module';
import { LanguagesModule } from '../languages/languages.module';
import { BillingModule } from '../billing/billing.module';
import { UsageModule } from '../usage/usage.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    IdentityModule,
    GatewayModule,
    LanguagesModule,
    BillingModule,
    UsageModule,
    ApiKeysModule,
    RateLimitModule,
  ],
  controllers: [VideoVoiceController],
  providers: [VideoVoiceService, TranslateAuthGuard],
  exports: [VideoVoiceService],
})
export class VideoVoiceModule {}
