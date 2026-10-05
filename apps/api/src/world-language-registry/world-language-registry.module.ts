import { Module } from '@nestjs/common';
import { WorldLanguageRegistryController } from './world-language-registry.controller';
import { WorldLanguageRegistryService } from './world-language-registry.service';

@Module({
  controllers: [WorldLanguageRegistryController],
  providers: [WorldLanguageRegistryService],
  exports: [WorldLanguageRegistryService],
})
export class WorldLanguageRegistryModule {}
