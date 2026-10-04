import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { BillingService } from '../billing/billing.service';
import {
  FamilyId,
  productFamiliesCatalog,
  productFamiliesHonesty,
  ProductReadiness,
} from './product-families.catalog';

@Injectable()
export class ProductFamiliesService {
  constructor(private readonly billing: BillingService) {}

  engine() {
    const catalog = productFamiliesCatalog();
    const counts = tally(catalog.products);
    return {
      ...catalog,
      honesty: productFamiliesHonesty(),
      score: counts,
    };
  }

  family(family: FamilyId) {
    const catalog = productFamiliesCatalog();
    const products = catalog.products.filter((p) => p.family === family);
    return {
      family,
      products,
      score: tally(products),
      honesty: productFamiliesHonesty(),
    };
  }

  async overview(session: SessionContext) {
    const entitlements = await this.billing.entitlements(session.organizationId);
    const engine = this.engine();
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine,
      entitlements,
      unlocks: {
        commercialLicense: entitlements.commercialLicense,
        instantVoiceCloning: entitlements.instantVoiceCloning,
        professionalVoiceCloning: entitlements.professionalVoiceCloning,
        creditsRemaining: entitlements.creditsRemaining,
        note: 'Charging unlocks higher monthly credits + commercial/PVC gates. shipped_e2e products debit the shared pool as documented.',
      },
      links: {
        billing: '/billing',
        creativeMedia: '/creative-media',
        videoVoice: '/video-voice',
        keys: '/keys',
        docs: '/docs',
      },
    };
  }

  monitoring() {
    const engine = this.engine();
    return {
      status: 'ready',
      score: engine.score,
      honesty: productFamiliesHonesty(),
    };
  }
}

function tally(products: ProductReadiness[]) {
  const byStatus = {
    shipped_e2e: 0,
    partial: 0,
    marketing_only: 0,
    broken: 0,
  };
  for (const p of products) byStatus[p.status] += 1;
  const byFamily = products.reduce(
    (acc, p) => {
      acc[p.family] = (acc[p.family] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  return {
    total: products.length,
    byStatus,
    byFamily,
    shippedRatio: products.length
      ? Math.round((byStatus.shipped_e2e / products.length) * 1000) / 1000
      : 0,
  };
}
