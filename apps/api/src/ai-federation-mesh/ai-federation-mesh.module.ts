import { Module } from '@nestjs/common';
import { AiFederationMeshController } from './ai-federation-mesh.controller';
import { AiFederationMeshService } from './ai-federation-mesh.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiFederationMeshController],
  providers: [AiFederationMeshService],
  exports: [AiFederationMeshService],
})
export class AiFederationMeshModule {}
