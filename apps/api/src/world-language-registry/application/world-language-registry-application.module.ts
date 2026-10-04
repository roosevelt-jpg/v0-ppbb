import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorldLanguageRegistryModule } from '../world-language-registry.module';
import { WORLD_LANGUAGE_REGISTRY_CATALOG_PORT } from './ports';
import { NestWorldLanguageRegistryCatalogAdapter } from './nest-world-language-registry.adapter';
import { WORLD_LANGUAGE_REGISTRY_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, WorldLanguageRegistryModule],
  providers: [
    NestWorldLanguageRegistryCatalogAdapter,
    { provide: WORLD_LANGUAGE_REGISTRY_CATALOG_PORT, useExisting: NestWorldLanguageRegistryCatalogAdapter },
    ...WORLD_LANGUAGE_REGISTRY_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class WorldLanguageRegistryApplicationModule {}
