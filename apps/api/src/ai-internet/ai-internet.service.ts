import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { aiInternetCatalog } from './ai-internet.catalog';

@Injectable()
export class AiInternetService {
  engine() {
    return {
      ...aiInternetCatalog(),
      ownAi: ownAiStackSummary(),
      pillars: [
        { id: 'identity-fabric', status: 'mapped', home: '/identity-federation' },
        { id: 'model-mesh', status: 'mapped', home: '/model-serving' },
        { id: 'knowledge-mesh', status: 'mapped', home: '/knowledge-fabric' },
        { id: 'agent-mesh', status: 'mapped', home: '/agent-fabric' },
        { id: 'trust-mesh', status: 'mapped', home: '/trust-cloud' },
        { id: 'economy-mesh', status: 'mapped', home: '/ai-economy' },
      ],
      note: 'AI Internet (v2 261–300) packaged as foundation hub over existing clouds — not a separate sci-fi OS.',
    };
  }

  overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
      },
      engine: this.engine(),
    };
  }
}
