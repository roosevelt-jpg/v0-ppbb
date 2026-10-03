import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AiInternetStoreService } from '../ai-internet-store/ai-internet-store.service';
import { aiInternetHonesty } from '../ai-internet-store/ai-internet-honesty';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';

const HUBS = [
    { slug: 'ai-internet', vl: 394, phase: 261, title: 'AI Internet' },
    { slug: 'ai-dns', vl: 395, phase: 262, title: 'AI DNS' },
    { slug: 'ai-identity-wallet', vl: 396, phase: 263, title: 'AI Identity Wallet' },
    { slug: 'ai-discovery', vl: 397, phase: 264, title: 'AI Discovery' },
    { slug: 'ai-federation-mesh', vl: 398, phase: 265, title: 'AI Federation Mesh' },
    { slug: 'a2a-protocol', vl: 399, phase: 266, title: 'A2A Protocol' },
    { slug: 'ai-trust-network', vl: 400, phase: 267, title: 'AI Trust Network' },
    { slug: 'ai-payment-network', vl: 401, phase: 268, title: 'AI Payment Network' },
    { slug: 'ai-certificate-authority', vl: 402, phase: 269, title: 'AI Certificate Authority' },
    { slug: 'ai-global-routing', vl: 403, phase: 270, title: 'AI Global Routing' },
    { slug: 'ai-governance-federation', vl: 404, phase: 271, title: 'AI Governance Federation' },
    { slug: 'ai-sovereignty-exchange', vl: 405, phase: 272, title: 'AI Sovereignty Exchange' },
    { slug: 'ai-marketplace-federation', vl: 406, phase: 273, title: 'AI Marketplace Federation' },
    { slug: 'verbalab-global-os', vl: 407, phase: 274, title: 'VerbaLab Global OS' },
    { slug: 'credentials-readiness', vl: 408, phase: 275, title: 'Credentials Readiness' },
  { slug: 'ai-internet-audit', vl: 409, phase: 276, title: 'AI Internet Production Audit' },
];

@Injectable()
export class AiInternetAuditService {
  constructor(private readonly store: AiInternetStoreService) {}

  engine() {
    return {
      id: 'ai-internet-audit',
      title: 'AI Internet Production Audit',
      vl: 'VL-409',
      phase: 276,
      hubs: HUBS,
      libraryCoverage: {
        phases: '261-300',
        packaged: true,
        globalOsFoundation: true,
        credentialsReadiness: true,
      },
      honesty: aiInternetHonesty(),
      ownAi: ownAiStackSummary(),
      docs: '/docs/ai-internet-audit/PRODUCTION_READINESS.md',
      note: 'VL-409 Volume 25 audit — AI Internet protocol software complete; keys later.',
    };
  }

  async overview(session: SessionContext) {
    return {
      engine: this.engine(),
      summary: await this.store.summary(session.organizationId),
    };
  }
}
