import { Module } from '@nestjs/common';
import { AiObservabilityController } from './ai-observability.controller';
import { AiObservabilityService } from './ai-observability.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [IdentityModule, PrismaModule],
  controllers: [AiObservabilityController],
  providers: [AiObservabilityService],
  exports: [AiObservabilityService],
})
export class AiObservabilityModule {}
