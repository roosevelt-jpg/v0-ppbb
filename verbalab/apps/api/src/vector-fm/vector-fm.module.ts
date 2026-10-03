import { Module } from '@nestjs/common';
import { VectorFmController } from './vector-fm.controller';
import { VectorFmService } from './vector-fm.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [VectorFmController],
  providers: [VectorFmService],
  exports: [VectorFmService],
})
export class VectorFmModule {}
