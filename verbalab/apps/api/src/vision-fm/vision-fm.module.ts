import { Module } from '@nestjs/common';
import { VisionFmController } from './vision-fm.controller';
import { VisionFmService } from './vision-fm.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [VisionFmController],
  providers: [VisionFmService],
  exports: [VisionFmService],
})
export class VisionFmModule {}
