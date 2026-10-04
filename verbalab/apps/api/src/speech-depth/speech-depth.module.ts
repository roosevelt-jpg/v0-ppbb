import { Module } from '@nestjs/common';
import { SpeechDepthController } from './speech-depth.controller';
import { SpeechDepthService } from './speech-depth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [SpeechDepthController],
  providers: [SpeechDepthService],
  exports: [SpeechDepthService],
})
export class SpeechDepthModule {}
