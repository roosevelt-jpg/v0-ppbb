import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  vaiosArchitectureNotes,
  vaiosHonesty,
  vaiosHubInventory,
  vaiosProductCatalog,
  vaiosRoutingTable,
  vaiosUnifiedSurfaces,
} from './vaios.catalog';

@Injectable()
export class VaiosService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'VerbaLab AI Operating System (VAIOS)',
      products: vaiosProductCatalog(),
      hubInventory: vaiosHubInventory(),
      unifiedSurfaces: vaiosUnifiedSurfaces(),
      architecture: vaiosArchitectureNotes(),
      honesty: vaiosHonesty(),
      safety: {
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        notLinux: true,
        notKubernetes: true,
        literalOsKernel: false,
        enterpriseEngineeringSystemOs: false,
        note: 'VAIOS is the unifying orchestration layer over AI Kernel and AI Fabric.',
      },
      docs: '/docs/VAIOS.md',
      note: 'VAIOS Foundation. Unifying orchestration over Kernel, Fabric, and Data Plane.',
    };
  }

  routing() {
    return {
      routes: vaiosRoutingTable(),
      products: vaiosProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      hubInventory: vaiosHubInventory(),
      unifiedSurfaces: vaiosUnifiedSurfaces(),
      honesty: vaiosHonesty(),
      note: 'Static VAIOS discovery catalog for Foundation.',
      docs: '/docs/VAIOS.md',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
        chat: usageSummary.chat,
        embeddings: usageSummary.embeddings,
      },
      products: vaiosProductCatalog(),
      hubInventory: vaiosHubInventory(),
      unifiedSurfaces: vaiosUnifiedSurfaces(),
      architecture: vaiosArchitectureNotes(),
      honesty: vaiosHonesty(),
      safety: {
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        notLinux: true,
        notKubernetes: true,
        note: 'VAIOS routes orchestration to Kernel, Fabric, and Data Plane surfaces.',
      },
      deferred: {
        enterpriseEngineeringSystemOs: true,
        serviceMeshOs: true,
        literalOsKernel: false,
      },
      links: {
        vaios: '/vaios',
        aiScheduler: '/ai-scheduler',
        runtimeManager: '/runtime-manager',
        resourceManager: '/resource-manager',
        workflowOperatingSystem: '/workflow-operating-system',
        agentOperatingSystem: '/agent-operating-system',
        aiMemoryOperatingSystem: '/ai-memory-operating-system',
        knowledgeOperatingSystem: '/knowledge-operating-system',
        pluginOperatingSystem: '/plugin-operating-system',
        aiKernel: '/ai-kernel',
        aiFabric: '/ai-fabric',
        dataPlaneCloud: '/data-plane-cloud',
      },
      docs: '/docs/VAIOS.md',
      note: 'VAIOS. Discovery hub over unifying orchestration façades; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = vaiosProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      hubInventory: vaiosHubInventory(),
      unifiedSurfaces: vaiosUnifiedSurfaces(),
      architecture: vaiosArchitectureNotes(),
      honesty: vaiosHonesty(),
      note: 'VAIOS monitoring snapshot.',
    };
  }
}
