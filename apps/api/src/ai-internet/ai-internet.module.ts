import { Module } from '@nestjs/common';
import { AiInternetController } from './ai-internet.controller';
import { AiInternetService } from './ai-internet.service';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [AiInternetController],
  providers: [AiInternetService],
  exports: [AiInternetService],
})
export class AiInternetModule {}
