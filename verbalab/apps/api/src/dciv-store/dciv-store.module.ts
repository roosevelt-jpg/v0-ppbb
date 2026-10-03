import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DcivStoreService } from './dciv-store.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [DcivStoreService],
  exports: [DcivStoreService],
})
export class DcivStoreModule {}
