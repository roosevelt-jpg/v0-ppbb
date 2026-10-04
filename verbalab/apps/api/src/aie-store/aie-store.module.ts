import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AieStoreService } from './aie-store.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AieStoreService],
  exports: [AieStoreService],
})
export class AieStoreModule {}
