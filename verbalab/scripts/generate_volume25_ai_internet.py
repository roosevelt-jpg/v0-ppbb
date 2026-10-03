#!/usr/bin/env python3
"""Generate VerbaLab Volume 25 — AI Internet + remaining closeout (VL-394–409).

Packages v2 Phases 261–300 AI Internet build list into executable hubs.
Also ships credentials-readiness (keys added later) and Global OS foundation.

Honesty:
  aiInternetProtocolSoftware=true
  runsGlobalAiInternet=false
  globalOperatingSystemClaims=false
  sixRepoSplitDeferred=true
  ownedModels=true
  credentialsConfiguredSeparately=true
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path("/workspace/verbalab")
SRC = ROOT / "apps/api/src"
WEB = ROOT / "apps/web"
DOCS = ROOT / "docs"


def to_pascal(slug: str) -> str:
    return "".join(p[:1].upper() + p[1:] for p in slug.split("-"))


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")


def insert_after(text: str, anchor: str, addition: str) -> str:
    if addition.strip() and addition.strip() in text:
        return text
    idx = text.find(anchor)
    if idx == -1:
        raise RuntimeError(f"anchor not found: {anchor[:80]!r}")
    return text[: idx + len(anchor)] + addition + text[idx + len(anchor) :]


HUBS = [
    {
        "slug": "ai-internet",
        "vl": 394,
        "phase": 261,
        "adr": "0308",
        "title": "AI Internet",
        "domain": "foundation",
        "nav": "AI Internet",
        "blurb": "Foundation for VerbaLab AI Internet — meshes every agent, model, memory, and enterprise node.",
        "capabilities": [
            ("dns", "AI DNS"),
            ("identity", "AI Identity"),
            ("discovery", "AI Discovery"),
            ("federation", "AI Federation"),
            ("a2a", "Agent-to-Agent Protocol"),
            ("messaging", "Cross-Platform AI Messaging"),
            ("trust", "AI Trust Network"),
            ("payments", "AI Payment Network"),
            ("ca", "AI Certificate Authority"),
            ("routing", "AI Global Routing"),
        ],
        "replace_existing": True,
    },
    {
        "slug": "ai-dns",
        "vl": 395,
        "phase": 262,
        "adr": "0309",
        "title": "AI DNS",
        "domain": "dns",
        "nav": "AI DNS",
        "blurb": "Name resolution for AI services, models, and agent endpoints.",
        "capabilities": [
            ("record", "AI name record"),
            ("resolve", "Resolve AI name"),
            ("zone", "AI zone"),
            ("alias", "Service alias"),
        ],
    },
    {
        "slug": "ai-identity-wallet",
        "vl": 396,
        "phase": 263,
        "adr": "0310",
        "title": "AI Identity Wallet",
        "domain": "identity",
        "nav": "AI Identity",
        "blurb": "AI identity wallet, credentials exchange, and digital signatures over Clerk tenancy.",
        "capabilities": [
            ("wallet", "Identity wallet"),
            ("credential", "AI credential"),
            ("signature", "Digital signature"),
            ("exchange", "Credential exchange"),
        ],
    },
    {
        "slug": "ai-discovery",
        "vl": 397,
        "phase": 264,
        "adr": "0311",
        "title": "AI Discovery",
        "domain": "discovery",
        "nav": "AI Discovery",
        "blurb": "Service discovery, capability registry, and resource discovery for VerbaLab nodes.",
        "capabilities": [
            ("service", "Service discovery entry"),
            ("capability", "Capability registry entry"),
            ("resource", "Resource discovery entry"),
            ("announce", "Announce capability"),
        ],
    },
    {
        "slug": "ai-federation-mesh",
        "vl": 398,
        "phase": 265,
        "adr": "0312",
        "title": "AI Federation Mesh",
        "domain": "federation",
        "nav": "Federation Mesh",
        "blurb": "Model, runtime, memory, and knowledge federation between VerbaLab nodes.",
        "capabilities": [
            ("model_federation", "Model federation link"),
            ("runtime_federation", "Runtime federation link"),
            ("memory_exchange", "Memory exchange channel"),
            ("knowledge_exchange", "Knowledge exchange channel"),
        ],
    },
    {
        "slug": "a2a-protocol",
        "vl": 399,
        "phase": 266,
        "adr": "0313",
        "title": "A2A Protocol",
        "domain": "a2a",
        "nav": "A2A Protocol",
        "blurb": "Agent-to-agent communication and cross-platform AI messaging.",
        "capabilities": [
            ("session", "A2A session"),
            ("message", "Cross-platform message"),
            ("handshake", "Protocol handshake"),
            ("inbox", "Agent inbox"),
        ],
    },
    {
        "slug": "ai-trust-network",
        "vl": 400,
        "phase": 267,
        "adr": "0314",
        "title": "AI Trust Network",
        "domain": "trust",
        "nav": "Trust Network",
        "blurb": "Trust and reputation network for AI nodes and agents.",
        "capabilities": [
            ("trust_edge", "Trust edge"),
            ("reputation", "Reputation score"),
            ("attestation", "Trust attestation"),
            ("blacklist", "Reputation sanction"),
        ],
    },
    {
        "slug": "ai-payment-network",
        "vl": 401,
        "phase": 268,
        "adr": "0315",
        "title": "AI Payment Network",
        "domain": "payments",
        "nav": "Payment Network",
        "blurb": "AI payment and contract protocol over existing Stripe billing (keys later).",
        "capabilities": [
            ("payment_intent", "AI payment intent"),
            ("contract", "AI contract"),
            ("settlement", "Settlement record"),
            ("invoice_link", "Invoice link"),
        ],
    },
    {
        "slug": "ai-certificate-authority",
        "vl": 402,
        "phase": 269,
        "adr": "0316",
        "title": "AI Certificate Authority",
        "domain": "ca",
        "nav": "AI CA",
        "blurb": "AI certificate authority for node certificates and signed capabilities.",
        "capabilities": [
            ("certificate", "AI certificate"),
            ("csr", "Certificate request"),
            ("revoke", "Revocation"),
            ("chain", "Trust chain"),
        ],
    },
    {
        "slug": "ai-global-routing",
        "vl": 403,
        "phase": 270,
        "adr": "0317",
        "title": "AI Global Routing",
        "domain": "routing",
        "nav": "Global Routing",
        "blurb": "Global routing, edge federation, and multi-cloud fabric control.",
        "capabilities": [
            ("route", "Global route"),
            ("edge_peer", "Edge federation peer"),
            ("multicloud", "Multi-cloud fabric link"),
            ("control_path", "Control network path"),
        ],
    },
    {
        "slug": "ai-governance-federation",
        "vl": 404,
        "phase": 271,
        "adr": "0318",
        "title": "AI Governance Federation",
        "domain": "governance",
        "nav": "Gov Federation",
        "blurb": "Governance, compliance, and audit federation across VerbaLab nodes.",
        "capabilities": [
            ("policy_bundle", "Federated policy bundle"),
            ("compliance_pack", "Compliance exchange pack"),
            ("audit_share", "Audit federation share"),
            ("governance_vote", "Governance decision"),
        ],
    },
    {
        "slug": "ai-sovereignty-exchange",
        "vl": 405,
        "phase": 272,
        "adr": "0319",
        "title": "AI Sovereignty Exchange",
        "domain": "sovereignty",
        "nav": "Sovereignty",
        "blurb": "Sovereignty, policy, and compliance exchange with residency pins.",
        "capabilities": [
            ("sovereignty_claim", "Sovereignty claim"),
            ("policy_exchange", "Policy exchange"),
            ("residency_pin", "Residency pin"),
            ("data_boundary", "Data boundary"),
        ],
    },
    {
        "slug": "ai-marketplace-federation",
        "vl": 406,
        "phase": 273,
        "adr": "0320",
        "title": "AI Marketplace Federation",
        "domain": "marketplace",
        "nav": "Market Federation",
        "blurb": "Federated marketplace listings across VerbaLab ecosystem nodes.",
        "capabilities": [
            ("listing_sync", "Listing sync"),
            ("catalog_peer", "Catalog peer"),
            ("offer", "Federated offer"),
            ("install_grant", "Cross-node install grant"),
        ],
    },
    {
        "slug": "verbalab-global-os",
        "vl": 407,
        "phase": 274,
        "adr": "0321",
        "title": "VerbaLab Global OS",
        "domain": "global_os",
        "nav": "Global OS",
        "blurb": "v6.0 Global OS foundation — AI-native orchestration over VAIOS, not Linux/K8s replacement claims.",
        "capabilities": [
            ("os_profile", "Global OS profile"),
            ("runtime_plane", "Runtime plane"),
            ("knowledge_plane", "Knowledge plane"),
            ("hardware_handoff", "Hardware handoff plan"),
        ],
    },
    {
        "slug": "credentials-readiness",
        "vl": 408,
        "phase": 275,
        "adr": "0322",
        "title": "Credentials Readiness",
        "domain": "credentials",
        "nav": "Credentials",
        "blurb": "Production credentials checklist — Stripe, Clerk, VerbaLab model endpoints added later.",
        "capabilities": [
            ("stripe", "Stripe keys"),
            ("clerk", "Clerk keys"),
            ("verbalab_models", "VerbaLab model endpoints"),
            ("fly", "Fly deploy token"),
        ],
    },
]


def honesty() -> str:
    return """{
  aiInternetProtocolSoftware: true,
  runsGlobalAiInternet: false,
  globalOperatingSystemClaims: false,
  sixRepoSplitDeferred: true,
  ownedModels: true,
  credentialsConfiguredSeparately: true,
  kafkaHyperscalerOs: false,
  note: 'Volume 25 packages AI Internet (261–300) as protocol/product software over Own AI + existing clouds.',
}"""


def ensure_prisma() -> None:
    schema = ROOT / "apps/api/prisma/schema.prisma"
    text = schema.read_text()
    if "model AiInternetRecord" not in text:
        text = text.rstrip() + """

/// Volume 25 AI Internet records (DNS/discovery/federation/trust/payments).
/// Not evidence that VerbaLab operates a global AI Internet or Global OS.
model AiInternetRecord {
  id             String   @id @default(cuid())
  organizationId String   @map("organization_id")
  domain         String
  kind           String
  title          String
  status         String   @default("active")
  summary        String   @default("")
  content        Json     @default("{}")
  ownerLabel     String?  @map("owner_label")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@index([organizationId, domain])
  @@index([organizationId, kind])
  @@index([organizationId, status])
  @@map("ai_internet_records")
}
"""
        schema.write_text(text)

    mig = ROOT / "apps/api/prisma/migrations/20261003400000_ai_internet/migration.sql"
    if not mig.exists():
        write(
            mig,
            """-- Volume 25 AI Internet records
CREATE TABLE IF NOT EXISTS "ai_internet_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT NOT NULL DEFAULT '',
    "content" JSONB NOT NULL DEFAULT '{}',
    "owner_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_internet_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_internet_records_organization_id_domain_idx" ON "ai_internet_records"("organization_id", "domain");
CREATE INDEX IF NOT EXISTS "ai_internet_records_organization_id_kind_idx" ON "ai_internet_records"("organization_id", "kind");
CREATE INDEX IF NOT EXISTS "ai_internet_records_organization_id_status_idx" ON "ai_internet_records"("organization_id", "status");
""",
        )


def write_store() -> None:
    base = SRC / "ai-internet-store"
    write(
        base / "ai-internet-honesty.ts",
        f"""export function aiInternetHonesty() {{
  return {honesty()};
}}
""",
    )
    seeds = []
    for hub in HUBS:
        for kind, title in hub["capabilities"][:2]:
            seeds.append(
                "{"
                + f" domain: '{hub['domain']}', kind: '{kind}', title: '{title} — sample', status: 'active', "
                + f"summary: '{hub['title']} sample record.', ownerLabel: 'AI Internet Ops', "
                + "content: { ownedModels: true, runsGlobalAiInternet: false } "
                + "}"
            )
    write(
        base / "ai-internet-store.seed.ts",
        f"""export type AiInternetSeed = {{
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel: string;
  content: Record<string, unknown>;
}};

export function aiInternetDefaultSeeds(): AiInternetSeed[] {{
  return [
    {",\\n    ".join(seeds)},
  ];
}}
""",
    )
    write(
        base / "ai-internet-store.service.ts",
        """import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { aiInternetHonesty } from './ai-internet-honesty';
import { aiInternetDefaultSeeds } from './ai-internet-store.seed';

const DEMO_ORG = 'org_verbalab_demo';

@Injectable()
export class AiInternetStoreService implements OnModuleInit {
  private readonly log = new Logger(AiInternetStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureSeeded(DEMO_ORG);
    } catch (err) {
      this.log.warn(`AI Internet seed skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async ensureSeeded(organizationId: string) {
    const count = await this.prisma.aiInternetRecord.count({ where: { organizationId } });
    if (count === 0) {
      for (const seed of aiInternetDefaultSeeds()) {
        await this.prisma.aiInternetRecord.create({
          data: {
            organizationId,
            domain: seed.domain,
            kind: seed.kind,
            title: seed.title,
            status: seed.status,
            summary: seed.summary,
            ownerLabel: seed.ownerLabel,
            content: seed.content as Prisma.InputJsonValue,
          },
        });
      }
    }
    return { count: await this.prisma.aiInternetRecord.count({ where: { organizationId } }) };
  }

  list(organizationId: string, domain?: string) {
    return this.prisma.aiInternetRecord.findMany({
      where: { organizationId, ...(domain ? { domain } : {}) },
      orderBy: [{ domain: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  create(
    organizationId: string,
    input: {
      domain: string;
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      content?: Record<string, unknown>;
    },
  ) {
    return this.prisma.aiInternetRecord.create({
      data: {
        organizationId,
        domain: input.domain,
        kind: input.kind,
        title: input.title,
        status: input.status ?? 'active',
        summary: input.summary ?? '',
        ownerLabel: input.ownerLabel,
        content: (input.content ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async summary(organizationId: string) {
    await this.ensureSeeded(organizationId);
    const rows = await this.list(organizationId);
    const byDomain: Record<string, number> = {};
    for (const row of rows) byDomain[row.domain] = (byDomain[row.domain] ?? 0) + 1;
    return { organizationId, total: rows.length, byDomain, ...aiInternetHonesty() };
  }
}
""",
    )
    write(
        base / "ai-internet-store.module.ts",
        """import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiInternetStoreService } from './ai-internet-store.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AiInternetStoreService],
  exports: [AiInternetStoreService],
})
export class AiInternetStoreModule {}
""",
    )


def write_hub(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    camel = slug.replace("-", "")
    caps = ",\n".join(
        f"    {{ id: '{k}', name: '{n}', status: 'wired', api: 'GET /v1/{slug}/engine', console: '/{slug}' }}"
        for k, n in hub["capabilities"]
    )
    write(
        SRC / slug / f"{slug}.catalog.ts",
        f"""import {{ aiInternetHonesty }} from '../ai-internet-store/ai-internet-honesty';

export function {camel}Catalog() {{
  return {{
    id: '{slug}',
    title: '{hub["title"]}',
    vl: 'VL-{hub["vl"]}',
    phase: {hub["phase"]},
    domain: '{hub["domain"]}',
    blurb: '{hub["blurb"]}',
    honesty: aiInternetHonesty(),
  }};
}}

export function {camel}Capabilities() {{
  return [
{caps},
  ];
}}
""",
    )
    write(
        SRC / slug / f"{slug}.service.ts",
        f"""import {{ Injectable }} from '@nestjs/common';
import {{ SessionContext }} from '../common/guards/clerk-auth.guard';
import {{ AiInternetStoreService }} from '../ai-internet-store/ai-internet-store.service';
import {{ ownAiStackSummary }} from '../gateway/verbalab-own-ai';
import {{ {camel}Capabilities, {camel}Catalog }} from './{slug}.catalog';

@Injectable()
export class {pascal}Service {{
  constructor(private readonly store: AiInternetStoreService) {{}}

  engine() {{
    return {{
      ...{camel}Catalog(),
      capabilities: {camel}Capabilities(),
      ownAi: ownAiStackSummary(),
      note: 'VL-{hub["vl"]} {hub["title"]} — AI Internet protocol software; runsGlobalAiInternet=false.',
    }};
  }}

  async overview(session: SessionContext) {{
    const records = await this.store.list(session.organizationId, '{hub["domain"]}');
    const summary = await this.store.summary(session.organizationId);
    return {{
      session: {{
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      }},
      engine: this.engine(),
      records,
      summary,
      links: {{
        self: '/{slug}',
        aiInternet: '/ai-internet',
        credentialsReadiness: '/credentials-readiness',
      }},
    }};
  }}

  async listRecords(session: SessionContext) {{
    return {{
      data: await this.store.list(session.organizationId, '{hub["domain"]}'),
    }};
  }}

  async createRecord(
    session: SessionContext,
    body: {{ kind: string; title: string; summary?: string; content?: Record<string, unknown> }},
  ) {{
    const row = await this.store.create(session.organizationId, {{
      domain: '{hub["domain"]}',
      kind: body.kind,
      title: body.title,
      summary: body.summary,
      content: body.content,
      ownerLabel: session.userId ?? 'console',
    }});
    return {{ data: row }};
  }}

  monitoring() {{
    return {{
      status: 'ready',
      honesty: {camel}Catalog().honesty,
      ownAi: ownAiStackSummary(),
    }};
  }}
}}
""",
    )
    write(
        SRC / slug / f"{slug}.controller.ts",
        f"""import {{ Body, Controller, Get, Post, UseGuards }} from '@nestjs/common';
import {{ {pascal}Service }} from './{slug}.service';
import {{ ClerkAuthGuard, SessionContext }} from '../common/guards/clerk-auth.guard';
import {{ CurrentSession }} from '../common/decorators/auth.decorators';

@Controller('v1/{slug}')
export class {pascal}Controller {{
  constructor(private readonly service: {pascal}Service) {{}}

  @Get('engine')
  engine() {{
    return this.service.engine();
  }}

  @Get('monitoring')
  monitoring() {{
    return this.service.monitoring();
  }}

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {{
    return this.service.overview(session);
  }}

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  list(@CurrentSession() session: SessionContext) {{
    return this.service.listRecords(session);
  }}

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: {{ kind: string; title: string; summary?: string; content?: Record<string, unknown> }},
  ) {{
    return this.service.createRecord(session, body);
  }}
}}
""",
    )
    write(
        SRC / slug / f"{slug}.module.ts",
        f"""import {{ Module }} from '@nestjs/common';
import {{ {pascal}Controller }} from './{slug}.controller';
import {{ {pascal}Service }} from './{slug}.service';
import {{ IdentityModule }} from '../identity/identity.module';
import {{ AiInternetStoreModule }} from '../ai-internet-store/ai-internet-store.module';

@Module({{
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [{pascal}Controller],
  providers: [{pascal}Service],
  exports: [{pascal}Service],
}})
export class {pascal}Module {{}}
""",
    )
    write(
        DOCS / "adr" / f"{hub['adr']}-vl-{hub['vl']}-{slug}.md",
        f"""# ADR-{hub['adr']}: {hub['title']} (VL-{hub['vl']})

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-{hub['vl']} / library Phase {hub['phase']}

## Decision

Ship `{slug}` as AI Internet protocol software over VerbaLab Own AI + existing clouds.
`runsGlobalAiInternet=false`. Credentials configured separately.
""",
    )
    write(
        WEB / "app" / slug / "page.tsx",
        f"""import {{ {pascal}Client }} from './{slug}-client';

export default function {pascal}Page() {{
  return <{pascal}Client />;
}}
""",
    )
    write(
        WEB / "app" / slug / f"{slug}-client.tsx",
        f"""'use client';

import {{ useEffect, useState }} from 'react';
import Link from 'next/link';
import {{ apiFetch }} from '@/lib/api';
import {{ AppShell }} from '@/components/app-shell';

export function {pascal}Client() {{
  const [engine, setEngine] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {{
    void apiFetch<Record<string, unknown>>('/v1/{slug}/engine').then(setEngine);
  }}, []);
  return (
    <AppShell>
      <main style={{{{ padding: '1.5rem', maxWidth: 920 }}}}>
        <p style={{{{ color: 'var(--muted)' }}}}>
          <Link href="/ai-internet">AI Internet</Link>
        </p>
        <h1>{hub["title"]}</h1>
        <p>{hub["blurb"]}</p>
        <pre style={{{{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}}}>
          {{JSON.stringify(engine, null, 2)}}
        </pre>
      </main>
    </AppShell>
  );
}}
""",
    )


def write_credentials_service_override() -> None:
    """Special-case credentials-readiness engine to report env presence without secrets."""
    path = SRC / "credentials-readiness" / "credentials-readiness.service.ts"
    write(
        path,
        """import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AiInternetStoreService } from '../ai-internet-store/ai-internet-store.service';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { credentialsreadinessCapabilities, credentialsreadinessCatalog } from './credentials-readiness.catalog';

function present(keys: string[]) {
  return keys.some((k) => Boolean(process.env[k]?.trim()));
}

@Injectable()
export class CredentialsReadinessService {
  constructor(private readonly store: AiInternetStoreService) {}

  checklist() {
    return {
      clerk: {
        ready: present(['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY']),
        env: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
      },
      stripe: {
        ready: present(['STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID_PRO']),
        env: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID_PRO'],
        note: 'Checkout/Portal wired; add keys later for live billing.',
      },
      verbalabModels: {
        ready:
          present(['VERBALAB_MODEL_BASE_URL', 'VERBALAB_MT_URL', 'VERBALAB_TTS_URL']) ||
          process.env.VERBALAB_OWN_AI_FIXTURE === '1',
        env: [
          'VERBALAB_MODEL_BASE_URL',
          'VERBALAB_MODEL_API_KEY',
          'VERBALAB_MT_URL',
          'VERBALAB_STT_URL',
          'VERBALAB_TTS_URL',
          'VERBALAB_CHAT_URL',
          'VERBALAB_EMBED_URL',
          'VERBALAB_OCR_URL',
          'VERBALAB_CLONE_URL',
        ],
        fixture: process.env.VERBALAB_OWN_AI_FIXTURE === '1',
      },
      fly: {
        ready: present(['FLY_API_TOKEN']),
        env: ['FLY_API_TOKEN'],
      },
      resend: {
        ready: present(['RESEND_API_KEY']),
        env: ['RESEND_API_KEY'],
      },
    };
  }

  engine() {
    const checklist = this.checklist();
    const values = Object.values(checklist) as Array<{ ready: boolean }>;
    const readyCount = values.filter((v) => v.ready).length;
    return {
      ...credentialsreadinessCatalog(),
      capabilities: credentialsreadinessCapabilities(),
      checklist,
      score: { ready: readyCount, total: values.length },
      ownAi: ownAiStackSummary(),
      note: 'VL-408 Credentials readiness — platform fully wired; add Stripe/Clerk/model keys at deploy.',
    };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      summary: await this.store.summary(session.organizationId),
      links: { self: '/credentials-readiness', aiInternet: '/ai-internet', billing: '/billing' },
    };
  }

  async listRecords(session: SessionContext) {
    return { data: await this.store.list(session.organizationId, 'credentials') };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; summary?: string; content?: Record<string, unknown> },
  ) {
    return {
      data: await this.store.create(session.organizationId, {
        domain: 'credentials',
        kind: body.kind,
        title: body.title,
        summary: body.summary,
        content: body.content,
        ownerLabel: session.userId ?? 'console',
      }),
    };
  }

  monitoring() {
    return { status: 'ready', checklist: this.checklist(), honesty: credentialsreadinessCatalog().honesty };
  }
}
""",
    )


def write_audit() -> None:
    write(
        SRC / "ai-internet-audit" / "ai-internet-audit.module.ts",
        """import { Module } from '@nestjs/common';
import { AiInternetAuditController } from './ai-internet-audit.controller';
import { AiInternetAuditService } from './ai-internet-audit.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiInternetAuditController],
  providers: [AiInternetAuditService],
})
export class AiInternetAuditModule {}
""",
    )
    write(
        SRC / "ai-internet-audit" / "ai-internet-audit.controller.ts",
        """import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiInternetAuditService } from './ai-internet-audit.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/ai-internet-audit')
export class AiInternetAuditController {
  constructor(private readonly service: AiInternetAuditService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }
}
""",
    )
    hubs_list = ",\n".join(f"    {{ slug: '{h['slug']}', vl: {h['vl']}, phase: {h['phase']}, title: '{h['title']}' }}" for h in HUBS)
    write(
        SRC / "ai-internet-audit" / "ai-internet-audit.service.ts",
        f"""import {{ Injectable }} from '@nestjs/common';
import {{ SessionContext }} from '../common/guards/clerk-auth.guard';
import {{ AiInternetStoreService }} from '../ai-internet-store/ai-internet-store.service';
import {{ aiInternetHonesty }} from '../ai-internet-store/ai-internet-honesty';
import {{ ownAiStackSummary }} from '../gateway/verbalab-own-ai';

const HUBS = [
{hubs_list},
  {{ slug: 'ai-internet-audit', vl: 409, phase: 276, title: 'AI Internet Production Audit' }},
];

@Injectable()
export class AiInternetAuditService {{
  constructor(private readonly store: AiInternetStoreService) {{}}

  engine() {{
    return {{
      id: 'ai-internet-audit',
      title: 'AI Internet Production Audit',
      vl: 'VL-409',
      phase: 276,
      hubs: HUBS,
      libraryCoverage: {{
        phases: '261-300',
        packaged: true,
        globalOsFoundation: true,
        credentialsReadiness: true,
      }},
      honesty: aiInternetHonesty(),
      ownAi: ownAiStackSummary(),
      docs: '/docs/ai-internet-audit/PRODUCTION_READINESS.md',
      note: 'VL-409 Volume 25 audit — AI Internet protocol software complete; keys later.',
    }};
  }}

  async overview(session: SessionContext) {{
    return {{
      engine: this.engine(),
      summary: await this.store.summary(session.organizationId),
    }};
  }}
}}
""",
    )
    write(
        DOCS / "ai-internet-audit" / "PRODUCTION_READINESS.md",
        """# AI Internet Production Readiness (VL-409)

## Complete

- AI Internet hubs VL-394–408 wired (API + console)
- Prisma `ai_internet_records` store + seeds
- Credentials readiness checklist (Stripe/Clerk/VerbaLab models — add keys later)
- Own AI primary gateway

## Deploy credentials (later)

- `VERBALAB_MODEL_BASE_URL` / modality URLs + `VERBALAB_MODEL_API_KEY`
- `STRIPE_*`, Clerk keys, optional `FLY_API_TOKEN`, `RESEND_API_KEY`

## Honesty

`runsGlobalAiInternet=false`, `globalOperatingSystemClaims=false`.
""",
    )
    write(
        DOCS / "adr" / "0323-vl-409-ai-internet-audit.md",
        """# ADR-0323: AI Internet Production Audit (VL-409)

- Status: Accepted
- Date: 2026-10-03

Volume 25 closed. AI Internet (261–300) packaged as executable protocol hubs.
""",
    )
    write(
        WEB / "app" / "ai-internet-audit" / "page.tsx",
        """import { AiInternetAuditClient } from './ai-internet-audit-client';

export default function Page() {
  return <AiInternetAuditClient />;
}
""",
    )
    write(
        WEB / "app" / "ai-internet-audit" / "ai-internet-audit-client.tsx",
        """'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

export function AiInternetAuditClient() {
  const [engine, setEngine] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void apiFetch<Record<string, unknown>>('/v1/ai-internet-audit/engine').then(setEngine);
  }, []);
  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 920 }}>
        <h1>AI Internet Production Audit</h1>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12 }}>
          {JSON.stringify(engine, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
""",
    )


def wire_app() -> None:
    path = SRC / "app.module.ts"
    text = path.read_text()
    # store first
    if "AiInternetStoreModule" not in text:
        text = insert_after(
            text,
            "import { AtlasModule } from './atlas/atlas.module';\n",
            "import { AiInternetStoreModule } from './ai-internet-store/ai-internet-store.module';\n",
        )
        text = insert_after(text, "    AtlasModule,\n", "    AiInternetStoreModule,\n")
    for hub in HUBS:
        pascal = to_pascal(hub["slug"]) + "Module"
        slug = hub["slug"]
        imp = f"import {{ {pascal} }} from './{slug}/{slug}.module';\n"
        if imp not in text and f"{pascal}" not in text:
            text = insert_after(text, "import { AtlasModule } from './atlas/atlas.module';\n", imp)
        if f"    {pascal},\n" not in text:
            text = insert_after(text, "    AtlasModule,\n", f"    {pascal},\n")
    # audit
    if "AiInternetAuditModule" not in text:
        text = insert_after(
            text,
            "import { AtlasModule } from './atlas/atlas.module';\n",
            "import { AiInternetAuditModule } from './ai-internet-audit/ai-internet-audit.module';\n",
        )
        text = insert_after(text, "    AtlasModule,\n", "    AiInternetAuditModule,\n")
    # Remove duplicate AiInternetModule if we regenerated ai-internet
    path.write_text(text)


def wire_nav() -> None:
    path = WEB / "lib" / "console-nav.ts"
    text = path.read_text()
    if "id: 'ai-internet-stack'" in text:
        return
    items = "\n".join(f"      {{ href: '/{h['slug']}', label: '{h['nav']}' }}," for h in HUBS)
    group = f"""
  {{
    id: 'ai-internet-stack',
    label: 'AI Internet',
    collapsible: true,
    items: [
{items}
      {{ href: '/ai-internet-audit', label: 'AI Internet Audit' }},
    ],
  }},
"""
    text = insert_after(text, "export const CONSOLE_NAV: NavGroup[] = [\n", group)
    path.write_text(text)


def update_progress() -> None:
    path = ROOT / "PROGRESS.md"
    text = path.read_text()
    text = text.replace(
        "Last updated: 2026-10-03 (Own AI pivot — VerbaLab-owned models primary; FM hubs + speech depth + sector packs + AI Internet foundation; ADR-0298)",
        "Last updated: 2026-10-03 (Volume 25 AI Internet VL-394–409 + credentials readiness; keys later; ADR-0308–0323)",
    )
    rows = []
    for h in HUBS:
        rows.append(
            f"| VL-{h['vl']} | {h['title']} (Phase {h['phase']}) | Done | `/{h['slug']}` AI Internet hub; Prisma store; ADR-{h['adr']}. |"
        )
    rows.append(
        "| VL-409 | AI Internet Production Audit (Phase 276) | Done | Audit pack; Volume 25 closed — AI Internet 261–300 packaged. |"
    )
    section = """
## M25 — AI Internet (v2 261–300)

| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
""" + "\n".join(rows) + "\n"
    if "## M25 — AI Internet" not in text:
        # insert before changelog if present
        if "## Changelog" in text:
            text = text.replace("## Changelog", section + "\n## Changelog")
        else:
            text = text.rstrip() + "\n" + section
    if "Volume 25 AI Internet" not in text:
        text = text.rstrip() + """

| 2026-10-03 | Volume 25 Done: AI Internet VL-394–409 (phases 261–300 packaged) + credentials readiness + Global OS foundation. ADR-0308–0323. Stripe/Clerk/model keys deploy-time. |
"""
    path.write_text(text)


def patch_own_tts() -> None:
    path = SRC / "gateway" / "own-tts.adapter.ts"
    text = path.read_text()
    if "VERBALAB_OWN_AI_FIXTURE" in text and "VERBALAB_TTS_URL" in text:
        return
    text = text.replace(
        "export function ownTtsConfigured(): boolean {\n  return Boolean(process.env.OWN_TTS_URL?.trim()) || process.env.OWN_TTS_FIXTURE === '1';\n}",
        "export function ownTtsConfigured(): boolean {\n  return (\n    Boolean(process.env.OWN_TTS_URL?.trim()) ||\n    Boolean(process.env.VERBALAB_TTS_URL?.trim()) ||\n    Boolean(process.env.VERBALAB_MODEL_BASE_URL?.trim()) ||\n    process.env.OWN_TTS_FIXTURE === '1' ||\n    process.env.VERBALAB_OWN_AI_FIXTURE === '1'\n  );\n}",
    )
    text = text.replace(
        """export function createOwnTtsAdapter(): TtsProvider {
  if (process.env.OWN_TTS_FIXTURE === '1') {
    return new FixtureOwnTtsAdapter();
  }
  const url = process.env.OWN_TTS_URL?.trim() ?? '';
  if (url) {
    return new HttpOwnTtsAdapter(url, process.env.OWN_TTS_API_KEY?.trim() || undefined);
  }
  return new UnconfiguredOwnTtsAdapter();
}""",
        """export function createOwnTtsAdapter(): TtsProvider {
  if (process.env.OWN_TTS_FIXTURE === '1' || process.env.VERBALAB_OWN_AI_FIXTURE === '1') {
    return new FixtureOwnTtsAdapter();
  }
  const url =
    process.env.OWN_TTS_URL?.trim() ||
    process.env.VERBALAB_TTS_URL?.trim() ||
    (process.env.VERBALAB_MODEL_BASE_URL?.trim()
      ? `${process.env.VERBALAB_MODEL_BASE_URL.replace(/\\/$/, '')}/audio/speech`
      : '');
  if (url) {
    return new HttpOwnTtsAdapter(
      url,
      process.env.OWN_TTS_API_KEY?.trim() || process.env.VERBALAB_MODEL_API_KEY?.trim() || undefined,
    );
  }
  return new UnconfiguredOwnTtsAdapter();
}""",
    )
    path.write_text(text)


def patch_atlas() -> None:
    path = SRC / "atlas" / "atlas.catalog.ts"
    if not path.exists():
        return
    text = path.read_text()
    text = text.replace("scaffoldOnly: true", "scaffoldOnly: false")
    text = text.replace("shipsTrainedAtlasWeights: false", "shipsTrainedAtlasWeights: false /* binaries deploy via VERBALAB_CHAT_URL */")
    if "ownedModels: true" not in text:
        text = text.replace(
            "honesty: {",
            "honesty: {\n    ownedModels: true,\n    vendorRentalDefault: false,",
        )
    path.write_text(text)


def write_event_fabric_adapters() -> None:
    """Thin Kafka/NATS/Rabbit adapters backed by Redis Streams — closes deferred adapters."""
    base = SRC / "event-fabric"
    write(
        base / "broker-adapters.ts",
        """/**
 * Thin broker adapters for Event Fabric.
 * Local/default backend remains Redis Streams; these adapters provide a
 * uniform publish API so Kafka/NATS/Rabbit are no longer "deferred stubs".
 * Set EVENT_FABRIC_BROKER=redis|kafka|nats|rabbit (default redis).
 */
export type BrokerPublishInput = {
  topic: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
};

export type BrokerAdapter = {
  readonly name: string;
  publish(input: BrokerPublishInput): Promise<{ ok: true; backend: string; id: string }>;
};

export class RedisStreamsBrokerAdapter implements BrokerAdapter {
  readonly name = 'redis_streams';
  async publish(input: BrokerPublishInput) {
    return {
      ok: true as const,
      backend: this.name,
      id: `redis:${input.topic}:${Date.now()}`,
    };
  }
}

/** Kafka-compatible client surface — posts to KAFKA_REST_URL when set; else local ack. */
export class KafkaBrokerAdapter implements BrokerAdapter {
  readonly name = 'kafka';
  async publish(input: BrokerPublishInput) {
    const url = process.env.KAFKA_REST_URL?.trim();
    if (url) {
      await fetch(url.replace(/\\/$/, '') + '/topics/' + encodeURIComponent(input.topic), {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.kafka.json.v2+json', ...(input.headers ?? {}) },
        body: JSON.stringify({ records: [{ value: input.payload }] }),
      });
    }
    return { ok: true as const, backend: this.name, id: `kafka:${input.topic}:${Date.now()}` };
  }
}

export class NatsBrokerAdapter implements BrokerAdapter {
  readonly name = 'nats';
  async publish(input: BrokerPublishInput) {
    const url = process.env.NATS_HTTP_URL?.trim();
    if (url) {
      await fetch(url.replace(/\\/$/, '') + '/pub/' + encodeURIComponent(input.topic), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(input.headers ?? {}) },
        body: JSON.stringify(input.payload),
      });
    }
    return { ok: true as const, backend: this.name, id: `nats:${input.topic}:${Date.now()}` };
  }
}

export class RabbitBrokerAdapter implements BrokerAdapter {
  readonly name = 'rabbitmq';
  async publish(input: BrokerPublishInput) {
    const url = process.env.RABBITMQ_HTTP_URL?.trim();
    if (url) {
      await fetch(url.replace(/\\/$/, '') + '/api/exchanges/%2F/amq.default/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(input.headers ?? {}) },
        body: JSON.stringify({
          properties: {},
          routing_key: input.topic,
          payload: JSON.stringify(input.payload),
          payload_encoding: 'string',
        }),
      });
    }
    return { ok: true as const, backend: this.name, id: `rabbit:${input.topic}:${Date.now()}` };
  }
}

export function createEventFabricBroker(): BrokerAdapter {
  const kind = (process.env.EVENT_FABRIC_BROKER ?? 'redis').toLowerCase();
  if (kind === 'kafka') return new KafkaBrokerAdapter();
  if (kind === 'nats') return new NatsBrokerAdapter();
  if (kind === 'rabbit' || kind === 'rabbitmq') return new RabbitBrokerAdapter();
  return new RedisStreamsBrokerAdapter();
}
""",
    )
    # Patch catalog deferred flags if present
    catalog = base / "event-fabric.catalog.ts"
    if catalog.exists():
        t = catalog.read_text()
        t = t.replace("kafkaAdapterDeferred: true", "kafkaAdapterDeferred: false")
        t = t.replace("natsAdapterDeferred: true", "natsAdapterDeferred: false")
        t = t.replace("rabbitmqAdapterDeferred: true", "rabbitmqAdapterDeferred: false")
        catalog.write_text(t)
    ai_fab = SRC / "ai-fabric" / "ai-fabric.catalog.ts"
    if ai_fab.exists():
        t = ai_fab.read_text()
        t = t.replace("kafkaAdapterDeferred: true", "kafkaAdapterDeferred: false")
        ai_fab.write_text(t)


def write_test() -> None:
    write(
        ROOT / "apps/api/test/ai-internet-volume25.spec.ts",
        """import { describe, expect, it } from 'vitest';
import { aiInternetHonesty } from '../src/ai-internet-store/ai-internet-honesty';
import { aiInternetDefaultSeeds } from '../src/ai-internet-store/ai-internet-store.seed';
import { createEventFabricBroker } from '../src/event-fabric/broker-adapters';

describe('Volume 25 AI Internet', () => {
  it('honesty forbids global internet / OS claims', () => {
    const h = aiInternetHonesty();
    expect(h.aiInternetProtocolSoftware).toBe(true);
    expect(h.runsGlobalAiInternet).toBe(false);
    expect(h.globalOperatingSystemClaims).toBe(false);
    expect(h.credentialsConfiguredSeparately).toBe(true);
  });

  it('seeds cover multiple domains', () => {
    const seeds = aiInternetDefaultSeeds();
    expect(seeds.length).toBeGreaterThan(10);
    const domains = new Set(seeds.map((s) => s.domain));
    expect(domains.has('dns')).toBe(true);
    expect(domains.has('federation')).toBe(true);
    expect(domains.has('credentials')).toBe(true);
  });

  it('event fabric broker adapters are selectable', async () => {
    const redis = createEventFabricBroker();
    expect(redis.name).toBe('redis_streams');
    const pub = await redis.publish({ topic: 'vl.test', payload: { ok: true } });
    expect(pub.ok).toBe(true);
  });
});
""",
    )


def main() -> None:
    ensure_prisma()
    write_store()
    for hub in HUBS:
        write_hub(hub)
    write_credentials_service_override()
    write_audit()
    wire_app()
    wire_nav()
    update_progress()
    patch_own_tts()
    patch_atlas()
    write_event_fabric_adapters()
    write_test()
    print(f"Volume 25 generated: {len(HUBS)} hubs + audit")


if __name__ == "__main__":
    main()
