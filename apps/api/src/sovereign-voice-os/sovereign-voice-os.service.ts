
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  sovereignVoiceOsCatalog,
  sovereignVoiceOsHonesty,
} from './sovereign-voice-os.catalog';
import { nationalVoiceRuntimeCatalog } from '../national-voice-runtime/national-voice-runtime.catalog';
import { civicVoiceEvidenceCatalog } from '../civic-voice-evidence/civic-voice-evidence.catalog';
import { mutualIntelligibilityCatalog } from '../mutual-intelligibility/mutual-intelligibility.catalog';
import { institutionalVoiceCatalog } from '../institutional-voice/institutional-voice.catalog';
import { offlineMeshVoiceCatalog } from '../offline-mesh-voice/offline-mesh-voice.catalog';

const PILLARS = [
  {
    id: 'national-voice-runtime',
    href: '/national-voice-runtime',
    api: '/v1/national-voice-runtime',
    catalog: nationalVoiceRuntimeCatalog,
  },
  {
    id: 'civic-voice-evidence',
    href: '/civic-voice-evidence',
    api: '/v1/civic-voice-evidence',
    catalog: civicVoiceEvidenceCatalog,
  },
  {
    id: 'mutual-intelligibility',
    href: '/mutual-intelligibility',
    api: '/v1/mutual-intelligibility',
    catalog: mutualIntelligibilityCatalog,
  },
  {
    id: 'institutional-voice',
    href: '/institutional-voice',
    api: '/v1/institutional-voice',
    catalog: institutionalVoiceCatalog,
  },
  {
    id: 'offline-mesh-voice',
    href: '/offline-mesh-voice',
    api: '/v1/offline-mesh-voice',
    catalog: offlineMeshVoiceCatalog,
  },
] as const;

@Injectable()
export class SovereignVoiceOsService {
  constructor(private readonly audit: AuditService) {}

  pillars() {
    return {
      pillars: PILLARS.map((p) => {
        const c = p.catalog();
        return {
          id: p.id,
          title: c.title,
          blurb: c.blurb,
          href: p.href,
          api: p.api,
          shipped: true,
          capabilities: c.capabilities.length,
        };
      }),
      count: PILLARS.length,
    };
  }

  engine() {
    return {
      ...sovereignVoiceOsCatalog(),
      safety: sovereignVoiceOsHonesty(),
      ...this.pillars(),
      buyers: ['ministries', 'central_banks', 'telcos', 'multilaterals', 'hospitals'],
    };
  }

  monitoring() {
    return { status: 'ready', honesty: sovereignVoiceOsHonesty(), pillars: PILLARS.length };
  }

  readiness() {
    return {
      checklist: [
        { id: 'residency_island', label: 'Deploy on matching VERBALAB_REGION island', required: true },
        { id: 'dpa', label: 'Signed DPA / ministry data processing agreement', required: true },
        { id: 'zone_pin', label: 'National zone pinned via National Voice Runtime', required: true },
        { id: 'evidence', label: 'Civic Voice Evidence Chain enabled for official channels', required: true },
        { id: 'corridor', label: 'At least one mutual-intelligibility corridor selected', required: false },
        { id: 'policy_corpus', label: 'Institutional Voice corpus ingested for public FAQ', required: false },
        { id: 'mesh', label: 'Offline mesh nodes registered for clinics/borders', required: false },
      ],
      note: 'Procurement-ready checklist — unlocks government / bank / hospital buyers when marked complete in ops.',
    };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        role: session.role,
      },
      engine: this.engine(),
      readiness: this.readiness(),
      links: { self: '/sovereign-voice-os', docs: '/docs/SOVEREIGN_VOICE_OS.md' },
    };
  }

  async compose(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const countryCode = String(body.countryCode ?? 'AF').trim().toUpperCase();
    const sectors = String(body.sectors ?? 'health,justice')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const corridors = String(body.corridors ?? 'eac')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const recipe = {
      recipeId: randomUUID(),
      countryCode,
      sectors,
      corridors,
      steps: [
        { pillar: 'national-voice-runtime', action: 'POST /v1/national-voice-runtime/zones', body: { countryCode, region: 'af' } },
        { pillar: 'civic-voice-evidence', action: 'POST /v1/civic-voice-evidence/append', body: { actor: 'ministry', utterance: 'bootstrap' } },
        ...corridors.map((c) => ({
          pillar: 'mutual-intelligibility',
          action: 'GET /v1/mutual-intelligibility/corridors',
          body: { prefer: c },
        })),
        ...(sectors.includes('health') || sectors.includes('justice')
          ? [{ pillar: 'institutional-voice', action: 'POST /v1/institutional-voice/agencies', body: { agencyId: `${countryCode.toLowerCase()}-gov`, name: `${countryCode} Government Voice` } }]
          : []),
        { pillar: 'offline-mesh-voice', action: 'POST /v1/offline-mesh-voice/nodes', body: { nodeId: `${countryCode.toLowerCase()}-edge-01`, country: countryCode } },
      ],
      createdAt: new Date().toISOString(),
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'sovereign-voice-os.compose',
      ip,
      metadata: { recipeId: recipe.recipeId, countryCode, sectors, corridors },
    });
    return recipe;
  }
}
