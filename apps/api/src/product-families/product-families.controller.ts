import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ProductFamiliesService } from './product-families.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';
import type { FamilyId } from './product-families.catalog';

@Controller('v1/product-families')
export class ProductFamiliesController {
  constructor(private readonly service: ProductFamiliesService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Get('families/:family')
  family(@Param('family') family: string) {
    const normalized = normalizeFamily(family);
    if (!normalized) {
      throw new ApiException(
        'not_found',
        'family must be VerbaCreative, VerbaAgents, VerbaAPI, or Resources',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.service.family(normalized);
  }
}

function normalizeFamily(raw: string): FamilyId | null {
  const key = raw.trim().toLowerCase().replace(/[\s_-]/g, '');
  if (key === 'verbacreative' || key === 'creative') return 'VerbaCreative';
  if (key === 'verbaagents' || key === 'agents') return 'VerbaAgents';
  if (key === 'verbaapi' || key === 'api') return 'VerbaAPI';
  if (key === 'resources' || key === 'resource') return 'Resources';
  return null;
}
