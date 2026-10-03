import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  controlPlaneCloudArchitectureNotes,
  controlPlaneCloudHonesty,
  controlPlaneCloudProductCatalog,
  controlPlaneCloudRoutingTable,
} from './control-plane-cloud.catalog';

@Injectable()
export class ControlPlaneCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'VerbaLab Control Plane Cloud',
      products: controlPlaneCloudProductCatalog(),
      architecture: controlPlaneCloudArchitectureNotes(),
      honesty: controlPlaneCloudHonesty(),
      safety: {
        executesInference: false,
        dataPlaneOs: false,
        kubernetesControlPlaneOs: false,
        istioOs: false,
        hashicorpVaultOs: false,
        secondPolicyOs: false,
        secondIdp: false,
        note: 'Highest-privilege management layer with envelope-encrypted secrets, audited production deploys, rollback, and least-privilege admin roles.',
      },
      docs: '/docs/CONTROL_PLANE_CLOUD.md',
      note: 'Control Plane Foundation. Manages orgs, policies, routing, billing, identity, and deployments — does not execute inference.',
    };
  }

  routing() {
    return {
      routes: controlPlaneCloudRoutingTable(),
      products: controlPlaneCloudProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: controlPlaneCloudHonesty(),
      note: 'Static Control Plane Cloud discovery catalog for Foundation.',
      docs: '/docs/CONTROL_PLANE_CLOUD.md',
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
      products: controlPlaneCloudProductCatalog(),
      architecture: controlPlaneCloudArchitectureNotes(),
      honesty: controlPlaneCloudHonesty(),
      safety: {
        executesInference: false,
        dataPlaneOs: false,
        note: 'Control Plane manages organizations, policies, routing, billing, identity, and deployments.',
      },
      deferred: {
        dataPlaneOs: true,
        executesInference: false,
        regeneratesVolumes1to16: false,
      },
      links: {
        controlPlaneCloud: '/control-plane-cloud',
        organizationControl: '/organization-control',
        globalConfigurationPlatform: '/global-configuration-platform',
        globalPolicyEngine: '/global-policy-engine',
        globalDeploymentController: '/global-deployment-controller',
        globalRoutingController: '/global-routing-controller',
        secretsCertificatePlatform: '/secrets-certificate-platform',
        globalScheduler: '/global-scheduler',
        controlPlaneAnalytics: '/control-plane-analytics',
        platformEngineeringCloud: '/platform-engineering-cloud',
        trustCloud: '/trust-cloud',
        policyFabric: '/policy-fabric',
      },
      docs: '/docs/CONTROL_PLANE_CLOUD.md',
      note: 'Control Plane Cloud. Discovery hub over org/config/policy/deploy/routing/secrets/scheduler/analytics; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = controlPlaneCloudProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      architecture: controlPlaneCloudArchitectureNotes(),
      honesty: controlPlaneCloudHonesty(),
      note: 'Control Plane Cloud monitoring snapshot.',
    };
  }
}
