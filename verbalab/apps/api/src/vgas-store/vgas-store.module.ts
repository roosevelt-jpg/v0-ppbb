import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VgasStoreService } from './vgas-store.service';

@Module({
  imports: [PrismaModule],
  providers: [VgasStoreService],
  exports: [VgasStoreService],
})
export class VgasStoreModule {}
