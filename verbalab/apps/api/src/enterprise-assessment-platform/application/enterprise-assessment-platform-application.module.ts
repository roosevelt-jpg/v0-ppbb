import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EnterpriseAssessmentPlatformModule } from '../enterprise-assessment-platform.module';
import { ENTERPRISE_ASSESSMENT_PLATFORM_CATALOG_PORT } from './ports';
import { NestEnterpriseAssessmentPlatformCatalogAdapter } from './nest-enterprise-assessment-platform.adapter';
import { ENTERPRISE_ASSESSMENT_PLATFORM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, EnterpriseAssessmentPlatformModule],
  providers: [
    NestEnterpriseAssessmentPlatformCatalogAdapter,
    { provide: ENTERPRISE_ASSESSMENT_PLATFORM_CATALOG_PORT, useExisting: NestEnterpriseAssessmentPlatformCatalogAdapter },
    ...ENTERPRISE_ASSESSMENT_PLATFORM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class EnterpriseAssessmentPlatformApplicationModule {}
