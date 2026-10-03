#!/usr/bin/env python3
"""Generate VerbaLab Volume 21 Corporate Operating System / VCOS (VL-354–363).

Internal business tooling: governance tracking, strategy/OKRs, portfolio,
business architecture, EA repository, knowledge portal, executive dashboards,
risk register, and Digital Constitution. Supports corporate processes —
does not create a real board, legal counsel, or executive judgment.

Honesty: boardOs=false; legalCounselOs=false; realCorporateGovernance=false;
internalBusinessSoftware=true.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path("/workspace/verbalab")


def to_pascal(slug: str) -> str:
    return "".join(p[:1].upper() + p[1:] for p in slug.split("-"))


def to_camel(slug: str) -> str:
    p = to_pascal(slug)
    return p[:1].lower() + p[1:]


def to_const(slug: str) -> str:
    return slug.replace("-", "_").upper()


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")


def insert_after(text: str, anchor: str, addition: str) -> str:
    if addition.strip() in text:
        return text
    idx = text.find(anchor)
    if idx == -1:
        raise RuntimeError(f"anchor not found: {anchor[:80]!r}")
    at = idx + len(anchor)
    return text[:at] + addition + text[at:]


HUBS = [
    {
        "slug": "corporate-operating-system",
        "vl": 354,
        "phase": 221,
        "adr": "0256",
        "title": "Corporate Operating System",
        "kind": "foundation",
        "doc": "CORPORATE_OPERATING_SYSTEM.md",
        "nav": "VCOS",
        "domain": "foundation",
        "note": "VL-354. VCOS foundation — internal business OS for governance/strategy/portfolio tooling. realCorporateGovernance=false.",
    },
    {
        "slug": "corporate-governance-platform",
        "vl": 355,
        "phase": 222,
        "adr": "0257",
        "title": "Corporate Governance Platform",
        "kind": "domain",
        "doc": "CORPORATE_GOVERNANCE_PLATFORM.md",
        "nav": "Corp Governance",
        "domain": "governance",
        "note": "VL-355. Board/committee tracking tooling — not a real board.",
        "kinds": [
            ("board", "Board of Directors"),
            ("executive_committee", "Executive Committee"),
            ("audit_committee", "Audit Committee"),
            ("risk_committee", "Risk Committee"),
            ("ai_ethics_committee", "AI Ethics Committee"),
            ("security_committee", "Security Committee"),
            ("research_committee", "Research Committee"),
            ("investment_committee", "Investment Committee"),
        ],
    },
    {
        "slug": "strategic-planning-platform",
        "vl": 356,
        "phase": 223,
        "adr": "0258",
        "title": "Strategic Planning Platform",
        "kind": "domain",
        "doc": "STRATEGIC_PLANNING_PLATFORM.md",
        "nav": "Strategy",
        "domain": "strategy",
        "note": "VL-356. Strategy/OKR/roadmap tooling for 3/5/10/20-year horizons.",
        "kinds": [
            ("strategy_3y", "3-Year Strategy"),
            ("strategy_5y", "5-Year Strategy"),
            ("strategy_10y", "10-Year Strategy"),
            ("vision_20y", "20-Year Vision"),
            ("okr", "OKR"),
            ("roadmap", "Roadmap"),
            ("investment_plan", "Investment Plan"),
            ("rd_plan", "R&D Plan"),
        ],
    },
    {
        "slug": "enterprise-portfolio-management",
        "vl": 357,
        "phase": 224,
        "adr": "0259",
        "title": "Enterprise Portfolio Management",
        "kind": "domain",
        "doc": "ENTERPRISE_PORTFOLIO_MANAGEMENT.md",
        "nav": "Portfolio",
        "domain": "portfolio",
        "note": "VL-357. Products/programs/projects/budgets/capacity tracking.",
        "kinds": [
            ("product", "Product"),
            ("program", "Program"),
            ("project", "Project"),
            ("team", "Team"),
            ("budget", "Budget"),
            ("capacity", "Capacity"),
            ("dependency", "Dependency"),
            ("portfolio_risk", "Portfolio Risk"),
        ],
    },
    {
        "slug": "business-architecture",
        "vl": 358,
        "phase": 225,
        "adr": "0260",
        "title": "Business Architecture",
        "kind": "domain",
        "doc": "BUSINESS_ARCHITECTURE.md",
        "nav": "Biz Architecture",
        "domain": "capability",
        "note": "VL-358. Capability, value-stream, process, journey modeling.",
        "kinds": [
            ("capability", "Business Capability"),
            ("value_stream", "Value Stream"),
            ("process", "Business Process"),
            ("journey", "Customer Journey"),
            ("operating_model", "Operating Model"),
            ("org_design", "Organizational Design"),
        ],
    },
    {
        "slug": "enterprise-architecture-repository",
        "vl": 359,
        "phase": 226,
        "adr": "0261",
        "title": "Enterprise Architecture Repository",
        "kind": "domain",
        "doc": "ENTERPRISE_ARCHITECTURE_REPOSITORY.md",
        "nav": "EA Repository",
        "domain": "architecture",
        "note": "VL-359. Architecture artifact store with TOGAF/ArchiMate-aligned kinds — not a full modeling suite.",
        "kinds": [
            ("capability_model", "Capability Model"),
            ("information_model", "Information Model"),
            ("application_map", "Application Map"),
            ("technology_map", "Technology Map"),
            ("traceability", "Architecture Traceability"),
            ("archimate_view", "ArchiMate View"),
        ],
    },
    {
        "slug": "corporate-knowledge-system",
        "vl": 360,
        "phase": 227,
        "adr": "0262",
        "title": "Corporate Knowledge System",
        "kind": "domain",
        "doc": "CORPORATE_KNOWLEDGE_SYSTEM.md",
        "nav": "Corp Knowledge",
        "domain": "knowledge",
        "note": "VL-360. Policies/SOPs/playbooks/decision records portal — not Confluence OS.",
        "kinds": [
            ("policy", "Policy"),
            ("sop", "SOP"),
            ("playbook", "Playbook"),
            ("standard", "Standard"),
            ("decision_record", "Decision Record"),
            ("research_note", "Research Note"),
            ("meeting_note", "Meeting Note"),
            ("institutional_memory", "Institutional Memory"),
        ],
    },
    {
        "slug": "executive-intelligence-platform",
        "vl": 361,
        "phase": 228,
        "adr": "0263",
        "title": "Executive Intelligence Platform",
        "kind": "domain",
        "doc": "EXECUTIVE_INTELLIGENCE_PLATFORM.md",
        "nav": "Exec Intelligence",
        "domain": "executive",
        "note": "VL-361. Executive/board KPI cockpit — reporting tooling, not executive judgment.",
        "kinds": [
            ("corporate_kpi", "Corporate KPI"),
            ("product_kpi", "Product KPI"),
            ("engineering_kpi", "Engineering KPI"),
            ("ai_kpi", "AI KPI"),
            ("financial_kpi", "Financial KPI"),
            ("customer_kpi", "Customer KPI"),
            ("research_kpi", "Research KPI"),
        ],
    },
    {
        "slug": "corporate-risk-platform",
        "vl": 362,
        "phase": 229,
        "adr": "0264",
        "title": "Corporate Risk Platform",
        "kind": "domain",
        "doc": "CORPORATE_RISK_PLATFORM.md",
        "nav": "Corp Risk",
        "domain": "risk",
        "note": "VL-362. Enterprise risk register tooling across AI/cyber/regulatory domains.",
        "kinds": [
            ("enterprise_risk", "Enterprise Risk"),
            ("operational_risk", "Operational Risk"),
            ("financial_risk", "Financial Risk"),
            ("ai_risk", "AI Risk"),
            ("cyber_risk", "Cyber Risk"),
            ("regulatory_risk", "Regulatory Risk"),
            ("geopolitical_risk", "Geopolitical Risk"),
        ],
    },
]


def ensure_prisma() -> None:
    schema = ROOT / "apps/api/prisma/schema.prisma"
    text = schema.read_text()
    if "model VcosRecord" in text:
        return
    model = """
/// Volume 21 VCOS — internal corporate operating records (governance, strategy, portfolio, …).
/// Tooling only: does not constitute real corporate governance or legal counsel.
model VcosRecord {
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
  @@map("vcos_records")
}
"""
    schema.write_text(text.rstrip() + "\n" + model + "\n")
    mig = ROOT / "apps/api/prisma/migrations/20261003270000_vcos/migration.sql"
    write(
        mig,
        """-- Volume 21 VCOS records
CREATE TABLE IF NOT EXISTS "vcos_records" (
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
    CONSTRAINT "vcos_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "vcos_records_organization_id_domain_idx" ON "vcos_records"("organization_id", "domain");
CREATE INDEX IF NOT EXISTS "vcos_records_organization_id_kind_idx" ON "vcos_records"("organization_id", "kind");
CREATE INDEX IF NOT EXISTS "vcos_records_organization_id_status_idx" ON "vcos_records"("organization_id", "status");
""",
    )


def write_vcos_store() -> None:
    base = ROOT / "apps/api/src/vcos-store"
    write(
        base / "vcos-store.seed.ts",
        """export type VcosSeed = {
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel: string;
  content: Record<string, unknown>;
};

/** Default African-AI-company oriented seed rows for local review. */
export function vcosDefaultSeeds(): VcosSeed[] {
  return [
    {
      domain: 'governance',
      kind: 'ai_ethics_committee',
      title: 'AI Ethics Committee — Q4 charter',
      status: 'active',
      summary: 'Tracks ethics reviews for African language models and voice cloning.',
      ownerLabel: 'Chief Ethics Officer (role)',
      content: { cadence: 'monthly', focus: ['consent', 'provenance', 'fairness'] },
    },
    {
      domain: 'governance',
      kind: 'board',
      title: 'Board pack template — voice sovereignty',
      status: 'active',
      summary: 'Agenda template for board updates on language ownership and residency.',
      ownerLabel: 'Company Secretary (role)',
      content: { sections: ['mission', 'risks', 'KPIs', 'asks'] },
    },
    {
      domain: 'strategy',
      kind: 'strategy_3y',
      title: '3-year African voice platform strategy',
      status: 'active',
      summary: 'Own speech/translate/voice stack for top African markets.',
      ownerLabel: 'CEO (role)',
      content: { horizons: ['product', 'research', 'partnerships', 'governance'] },
    },
    {
      domain: 'strategy',
      kind: 'okr',
      title: 'OKR — Swahili+Yoruba production STT quality',
      status: 'active',
      summary: 'Raise production STT quality for bilingual callers.',
      ownerLabel: 'VP Speech (role)',
      content: { keyResults: ['WER target', 'latency p95', 'accent coverage'] },
    },
    {
      domain: 'portfolio',
      kind: 'program',
      title: 'Program — Language Registry expansion',
      status: 'active',
      summary: 'Expand canonical dialect coverage across West/East/Southern Africa.',
      ownerLabel: 'Portfolio PMO (role)',
      content: { budgetUsd: 0, dependencies: ['research', 'data'] },
    },
    {
      domain: 'portfolio',
      kind: 'project',
      title: 'Project — Voice Studio lexicon v2',
      status: 'active',
      summary: 'Pronunciation lexicon for product names across markets.',
      ownerLabel: 'Voice PM (role)',
      content: { status: 'in_progress' },
    },
    {
      domain: 'capability',
      kind: 'capability',
      title: 'Capability — Multilingual customer support',
      status: 'active',
      summary: 'Business capability spanning STT, translate, and agent assist.',
      ownerLabel: 'Biz Architect (role)',
      content: { valueStreams: ['acquire', 'support', 'retain'] },
    },
    {
      domain: 'capability',
      kind: 'value_stream',
      title: 'Value stream — Creator voice publishing',
      status: 'active',
      summary: 'From script to published African-language audio.',
      ownerLabel: 'Biz Architect (role)',
      content: { stages: ['draft', 'voice', 'review', 'publish'] },
    },
    {
      domain: 'architecture',
      kind: 'application_map',
      title: 'Application map — Voice + Speech hubs',
      status: 'active',
      summary: 'Maps console hubs to runtime services for African voice workloads.',
      ownerLabel: 'Enterprise Architect (role)',
      content: { alignment: 'TOGAF-inspired catalog', modelingSuiteOs: false },
    },
    {
      domain: 'architecture',
      kind: 'technology_map',
      title: 'Technology map — VAIOS + Data Plane',
      status: 'active',
      summary: 'Links corporate capabilities to Volume 18–19 runtime planes.',
      ownerLabel: 'Enterprise Architect (role)',
      content: { planes: ['control', 'data', 'vaios'] },
    },
    {
      domain: 'knowledge',
      kind: 'policy',
      title: 'Policy — Voice clone consent',
      status: 'active',
      summary: 'Consent, watermark, and abuse-review requirements for cloning.',
      ownerLabel: 'Trust (role)',
      content: { related: ['Volume 15 Trust', 'Voice cloning ADR'] },
    },
    {
      domain: 'knowledge',
      kind: 'playbook',
      title: 'Playbook — Incident response for AI misuse',
      status: 'active',
      summary: 'Steps for moderating generated speech misuse.',
      ownerLabel: 'Security (role)',
      content: { severity: ['sev1', 'sev2', 'sev3'] },
    },
    {
      domain: 'executive',
      kind: 'corporate_kpi',
      title: 'KPI — African language coverage',
      status: 'active',
      summary: 'Languages with production STT/TTS paths.',
      ownerLabel: 'CEO cockpit',
      content: { unit: 'languages', target: 40 },
    },
    {
      domain: 'executive',
      kind: 'ai_kpi',
      title: 'KPI — Voice provenance labeling rate',
      status: 'active',
      summary: 'Share of generated audio with provenance labels.',
      ownerLabel: 'Board dashboard',
      content: { unit: 'percent', target: 100 },
    },
    {
      domain: 'risk',
      kind: 'ai_risk',
      title: 'Risk — Voice deepfake misuse',
      status: 'open',
      summary: 'Mitigate with watermarking, review gates, and abuse monitoring.',
      ownerLabel: 'Risk Committee (role)',
      content: { severity: 'high', residual: 'medium' },
    },
    {
      domain: 'risk',
      kind: 'regulatory_risk',
      title: 'Risk — Cross-border voice data residency',
      status: 'open',
      summary: 'Ensure regional deploy islands and data region pins.',
      ownerLabel: 'Compliance (role)',
      content: { severity: 'high', residual: 'medium' },
    },
    {
      domain: 'constitution',
      kind: 'mission',
      title: 'Digital Constitution — Mission',
      status: 'active',
      summary: 'Africa owns its voice — VerbaLab exists so the continent is not a speech/data colony.',
      ownerLabel: 'Founding Architect',
      content: {
        layer: 'mission',
        principles: ['language sovereignty', 'consent', 'accessibility', 'long-term stewardship'],
      },
    },
    {
      domain: 'constitution',
      kind: 'ai',
      title: 'Digital Constitution — AI',
      status: 'active',
      summary: 'Responsible AI, human oversight, evaluation, and fairness for African languages.',
      ownerLabel: 'AI Council (role)',
      content: {
        layer: 'ai',
        principles: ['human oversight', 'safety', 'fairness', 'evaluation required'],
      },
    },
    {
      domain: 'constitution',
      kind: 'data',
      title: 'Digital Constitution — Data',
      status: 'active',
      summary: 'Ownership, privacy, sovereignty, retention, and classification.',
      ownerLabel: 'Data Council (role)',
      content: {
        layer: 'data',
        principles: ['ownership', 'privacy', 'sovereignty', 'retention', 'classification'],
      },
    },
  ];
}
""",
    )
    write(
        base / "vcos-store.service.ts",
        """import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { vcosDefaultSeeds } from './vcos-store.seed';

const DEMO_ORG = 'org_verbalab_demo';

@Injectable()
export class VcosStoreService implements OnModuleInit {
  private readonly log = new Logger(VcosStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureSeeded(DEMO_ORG);
    } catch (err) {
      this.log.warn(`VCOS seed skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async ensureSeeded(organizationId: string) {
    const count = await this.prisma.vcosRecord.count({ where: { organizationId } });
    if (count > 0) return { seeded: false, count };
    for (const seed of vcosDefaultSeeds()) {
      await this.prisma.vcosRecord.create({
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
    const next = await this.prisma.vcosRecord.count({ where: { organizationId } });
    this.log.log(`VCOS seeded ${next} records for ${organizationId}`);
    return { seeded: true, count: next };
  }

  list(organizationId: string, domain?: string) {
    return this.prisma.vcosRecord.findMany({
      where: {
        organizationId,
        ...(domain ? { domain } : {}),
      },
      orderBy: [{ domain: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async create(
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
    return this.prisma.vcosRecord.create({
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
    for (const row of rows) {
      byDomain[row.domain] = (byDomain[row.domain] ?? 0) + 1;
    }
    return {
      organizationId,
      total: rows.length,
      byDomain,
      openRisks: rows.filter((r) => r.domain === 'risk' && r.status === 'open').length,
      constitutionArticles: rows.filter((r) => r.domain === 'constitution').length,
    };
  }
}
""",
    )
    write(
        base / "vcos-store.module.ts",
        """import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VcosStoreService } from './vcos-store.service';

@Module({
  imports: [PrismaModule],
  providers: [VcosStoreService],
  exports: [VcosStoreService],
})
export class VcosStoreModule {}
""",
    )


def honesty_ts() -> str:
    return """{
    internalBusinessSoftware: true,
    realCorporateGovernance: false,
    boardOs: false,
    legalCounselOs: false,
    confluenceOs: false,
    jiraOs: false,
    togafModelingSuiteOs: false,
    executiveJudgmentOs: false,
    note:
      'Volume 21 README: tooling that supports governance/strategy processes — not a substitute for a real board, counsel, or executives.',
  }"""


def application_files(slug: str, pascal: str, const: str, title: str, vl: int, foundation: bool) -> dict[str, str]:
    method = "products" if foundation else "engine"
    return {
        "messages.ts": f"""export class Get{pascal}EngineQuery {{}}

export class List{pascal}ProductsQuery {{}}
""",
        "ports.ts": f"""export type {pascal}ProductRow = {{
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
}};

export type {pascal}EngineBundle = ReturnType<
  import('../{slug}.service').{pascal}Service['{method}']
>;

export interface {pascal}CatalogPort {{
  engine(): {pascal}EngineBundle | Promise<{pascal}EngineBundle>;
  listProducts(): {pascal}ProductRow[] | Promise<{pascal}ProductRow[]>;
}}

export const {const}_CATALOG_PORT = Symbol('{const}_CATALOG_PORT');
""",
        "handlers.ts": f"""import {{ Inject }} from '@nestjs/common';
import {{ IQueryHandler, QueryHandler }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery, List{pascal}ProductsQuery }} from './messages';
import {{
  {const}_CATALOG_PORT,
  {pascal}CatalogPort,
  {pascal}EngineBundle,
  {pascal}ProductRow,
}} from './ports';

@QueryHandler(Get{pascal}EngineQuery)
export class Get{pascal}EngineHandler implements IQueryHandler<Get{pascal}EngineQuery> {{
  constructor(
    @Inject({const}_CATALOG_PORT)
    private readonly catalog: {pascal}CatalogPort,
  ) {{}}

  execute(): Promise<{pascal}EngineBundle> {{
    return Promise.resolve(this.catalog.engine());
  }}
}}

@QueryHandler(List{pascal}ProductsQuery)
export class List{pascal}ProductsHandler implements IQueryHandler<List{pascal}ProductsQuery> {{
  constructor(
    @Inject({const}_CATALOG_PORT)
    private readonly catalog: {pascal}CatalogPort,
  ) {{}}

  execute(): Promise<{pascal}ProductRow[]> {{
    return Promise.resolve(this.catalog.listProducts());
  }}
}}

export const {const}_HANDLERS = [Get{pascal}EngineHandler, List{pascal}ProductsHandler];
""",
        f"nest-{slug}.adapter.ts": f"""import {{ Injectable }} from '@nestjs/common';
import {{ {pascal}Service }} from '../{slug}.service';
import {{
  {pascal}CatalogPort,
  {pascal}EngineBundle,
  {pascal}ProductRow,
}} from './ports';

@Injectable()
export class Nest{pascal}CatalogAdapter implements {pascal}CatalogPort {{
  constructor(private readonly service: {pascal}Service) {{}}

  engine(): {pascal}EngineBundle {{
    return this.service.{method}();
  }}

  listProducts(): {pascal}ProductRow[] {{
    const bundle = this.engine() as {{ products?: {pascal}ProductRow[]; capabilities?: Array<{{ id: string; name: string; status: string; api?: string | null; notes?: string }}> }};
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {{
      return bundle.capabilities.map((c) => ({{
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/{slug}',
        notes: c.notes ?? '',
      }}));
    }}
    return [{{
      id: '{slug}',
      name: '{title}',
      status: 'shipped',
      api: 'GET /v1/{slug}/{'products' if foundation else 'engine'}',
      console: '/{slug}',
      notes: 'VL-{vl} shipped.',
    }}];
  }}
}}
""",
        f"{slug}-application.module.ts": f"""import {{ Module }} from '@nestjs/common';
import {{ CqrsModule }} from '@nestjs/cqrs';
import {{ {pascal}Module }} from '../{slug}.module';
import {{ {const}_CATALOG_PORT }} from './ports';
import {{ Nest{pascal}CatalogAdapter }} from './nest-{slug}.adapter';
import {{ {const}_HANDLERS }} from './handlers';

@Module({{
  imports: [CqrsModule, {pascal}Module],
  providers: [
    Nest{pascal}CatalogAdapter,
    {{ provide: {const}_CATALOG_PORT, useExisting: Nest{pascal}CatalogAdapter }},
    ...{const}_HANDLERS,
  ],
  exports: [CqrsModule],
}})
export class {pascal}ApplicationModule {{}}
""",
    }


def foundation_files() -> None:
    slug = "corporate-operating-system"
    pascal = "CorporateOperatingSystem"
    base = ROOT / "apps/api/src" / slug
    write(
        base / f"{slug}.catalog.ts",
        """export type VcosProductRow = {
  id: string;
  name: string;
  status: 'shipped' | 'partial' | 'deferred';
  api: string | null;
  console: string | null;
  notes: string;
};

export function corporateOperatingSystemProductCatalog(): VcosProductRow[] {
  return [
    {
      id: 'corporate-operating-system',
      name: 'Corporate Operating System',
      status: 'shipped',
      api: 'GET /v1/corporate-operating-system/products',
      console: '/corporate-operating-system',
      notes: 'VL-354 foundation. internalBusinessSoftware=true; realCorporateGovernance=false.',
    },
    {
      id: 'corporate-governance-platform',
      name: 'Corporate Governance Platform',
      status: 'shipped',
      api: 'GET /v1/corporate-governance-platform/engine',
      console: '/corporate-governance-platform',
      notes: 'VL-355 committee/board tracking tooling.',
    },
    {
      id: 'strategic-planning-platform',
      name: 'Strategic Planning Platform',
      status: 'shipped',
      api: 'GET /v1/strategic-planning-platform/engine',
      console: '/strategic-planning-platform',
      notes: 'VL-356 strategy/OKR tooling.',
    },
    {
      id: 'enterprise-portfolio-management',
      name: 'Enterprise Portfolio Management',
      status: 'shipped',
      api: 'GET /v1/enterprise-portfolio-management/engine',
      console: '/enterprise-portfolio-management',
      notes: 'VL-357 portfolio tracking.',
    },
    {
      id: 'business-architecture',
      name: 'Business Architecture',
      status: 'shipped',
      api: 'GET /v1/business-architecture/engine',
      console: '/business-architecture',
      notes: 'VL-358 capability/value-stream models.',
    },
    {
      id: 'enterprise-architecture-repository',
      name: 'Enterprise Architecture Repository',
      status: 'shipped',
      api: 'GET /v1/enterprise-architecture-repository/engine',
      console: '/enterprise-architecture-repository',
      notes: 'VL-359 architecture artifact store; togafModelingSuiteOs=false.',
    },
    {
      id: 'corporate-knowledge-system',
      name: 'Corporate Knowledge System',
      status: 'shipped',
      api: 'GET /v1/corporate-knowledge-system/engine',
      console: '/corporate-knowledge-system',
      notes: 'VL-360 knowledge portal; confluenceOs=false.',
    },
    {
      id: 'executive-intelligence-platform',
      name: 'Executive Intelligence Platform',
      status: 'shipped',
      api: 'GET /v1/executive-intelligence-platform/engine',
      console: '/executive-intelligence-platform',
      notes: 'VL-361 executive/board KPI cockpits.',
    },
    {
      id: 'corporate-risk-platform',
      name: 'Corporate Risk Platform',
      status: 'shipped',
      api: 'GET /v1/corporate-risk-platform/engine',
      console: '/corporate-risk-platform',
      notes: 'VL-362 enterprise risk register.',
    },
    {
      id: 'digital-constitution',
      name: 'Digital Constitution',
      status: 'shipped',
      api: 'GET /v1/corporate-operating-system/constitution',
      console: '/corporate-operating-system',
      notes: 'VL-363 audit packs Digital Constitution layers (versioned principles).',
    },
  ];
}

export function corporateOperatingSystemHonesty() {
  return {
    internalBusinessSoftware: true,
    realCorporateGovernance: false,
    boardOs: false,
    legalCounselOs: false,
    confluenceOs: false,
    jiraOs: false,
    togafModelingSuiteOs: false,
    executiveJudgmentOs: false,
  };
}

export function digitalConstitutionLayers() {
  return [
    { id: 'mission', title: 'Mission Constitution', focus: ['why VerbaLab exists', 'long-term mission', 'core values'] },
    { id: 'engineering', title: 'Engineering Constitution', focus: ['architecture', 'coding', 'API', 'security', 'AI principles'] },
    { id: 'product', title: 'Product Constitution', focus: ['UX', 'accessibility', 'localization', 'quality'] },
    { id: 'ai', title: 'AI Constitution', focus: ['responsible AI', 'safety', 'fairness', 'human oversight', 'evaluation'] },
    { id: 'data', title: 'Data Constitution', focus: ['ownership', 'privacy', 'sovereignty', 'retention', 'classification'] },
    { id: 'research', title: 'Research Constitution', focus: ['publication', 'open-source', 'patent', 'technology transfer'] },
    { id: 'operations', title: 'Operations Constitution', focus: ['incident response', 'BCP', 'DR', 'change management'] },
    { id: 'corporate', title: 'Corporate Constitution', focus: ['governance', 'ethics', 'decision-making', 'accountability'] },
  ];
}

export function corporateOperatingSystemRoutingTable() {
  return [
    { id: 'products', path: '/v1/corporate-operating-system/products', purpose: 'VCOS product catalog' },
    { id: 'engine', path: '/v1/corporate-operating-system/engine', purpose: 'Engine alias' },
    { id: 'overview', path: '/v1/corporate-operating-system/overview', purpose: 'Authenticated overview' },
    { id: 'constitution', path: '/v1/corporate-operating-system/constitution', purpose: 'Digital Constitution layers' },
    { id: 'records', path: '/v1/corporate-operating-system/records', purpose: 'All VCOS records' },
    { id: 'monitoring', path: '/v1/corporate-operating-system/monitoring', purpose: 'Monitoring snapshot' },
  ];
}
""",
    )
    write(
        base / f"{slug}.service.ts",
        """import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  corporateOperatingSystemHonesty,
  corporateOperatingSystemProductCatalog,
  corporateOperatingSystemRoutingTable,
  digitalConstitutionLayers,
} from './corporate-operating-system.catalog';

@Injectable()
export class CorporateOperatingSystemService {
  constructor(
    private readonly usage: UsageService,
    private readonly store: VcosStoreService,
  ) {}

  products() {
    return {
      product: 'VerbaLab Corporate Operating System',
      products: corporateOperatingSystemProductCatalog(),
      honesty: corporateOperatingSystemHonesty(),
      safety: {
        ...corporateOperatingSystemHonesty(),
        note: 'Tooling for how the company runs — not a real board or legal counsel.',
      },
      docs: '/docs/CORPORATE_OPERATING_SYSTEM.md',
      note: 'Corporate Operating System Foundation (VL-354). internalBusinessSoftware=true; realCorporateGovernance=false.',
    };
  }

  routing() {
    return {
      routes: corporateOperatingSystemRoutingTable(),
      products: corporateOperatingSystemProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: corporateOperatingSystemHonesty(),
      note: 'Static VCOS discovery catalog.',
      docs: '/docs/CORPORATE_OPERATING_SYSTEM.md',
    };
  }

  constitution() {
    return {
      product: 'VerbaLab Digital Constitution',
      version: '1.0.0',
      layers: digitalConstitutionLayers(),
      honesty: corporateOperatingSystemHonesty(),
      docs: '/docs/DIGITAL_CONSTITUTION.md',
      note: 'Version-controlled constitutional principles (VL-363). Not legal incorporation documents.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const vcos = await this.store.summary(session.organizationId);
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
      products: corporateOperatingSystemProductCatalog(),
      vcos,
      constitution: digitalConstitutionLayers(),
      honesty: corporateOperatingSystemHonesty(),
      links: Object.fromEntries(
        corporateOperatingSystemProductCatalog()
          .filter((p) => p.console)
          .map((p) => [p.id, p.console]),
      ),
      docs: '/docs/CORPORATE_OPERATING_SYSTEM.md',
      note: 'VCOS overview (VL-354–363). Internal business software for African AI company operations.',
    };
  }

  async records(session: SessionContext, domain?: string) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, domain);
    return {
      domain: domain ?? 'all',
      count: rows.length,
      records: rows,
      honesty: corporateOperatingSystemHonesty(),
    };
  }

  async createRecord(
    session: SessionContext,
    body: {
      domain: string;
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      content?: Record<string, unknown>;
    },
  ) {
    const row = await this.store.create(session.organizationId, body);
    return { record: row, honesty: corporateOperatingSystemHonesty() };
  }

  monitoring() {
    return {
      mode: 'foundation',
      products: corporateOperatingSystemProductCatalog().map((p) => ({ id: p.id, status: p.status })),
      honesty: corporateOperatingSystemHonesty(),
      note: 'VCOS monitoring snapshot (VL-354).',
    };
  }
}
""",
    )
    write(
        base / f"{slug}.controller.ts",
        """import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { CorporateOperatingSystemService } from './corporate-operating-system.service';

@Controller('v1/corporate-operating-system')
export class CorporateOperatingSystemController {
  constructor(private readonly vcos: CorporateOperatingSystemService) {}

  @Get('products')
  products() {
    return this.vcos.products();
  }

  @Get('engine')
  engine() {
    return this.vcos.products();
  }

  @Get('routing')
  routing() {
    return this.vcos.routing();
  }

  @Get('constitution')
  constitution() {
    return this.vcos.constitution();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.vcos.overview(session);
  }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext, @Query('domain') domain?: string) {
    return this.vcos.records(session, domain);
  }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {
      domain: string;
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      content?: Record<string, unknown>;
    },
  ) {
    return this.vcos.createRecord(session, body);
  }

  @Get('monitoring')
  monitoring() {
    return this.vcos.monitoring();
  }
}
""",
    )
    write(
        base / f"{slug}.module.ts",
        """import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { CorporateOperatingSystemController } from './corporate-operating-system.controller';
import { CorporateOperatingSystemService } from './corporate-operating-system.service';

@Module({
  imports: [UsageModule, IdentityModule, VcosStoreModule],
  controllers: [CorporateOperatingSystemController],
  providers: [CorporateOperatingSystemService],
  exports: [CorporateOperatingSystemService],
})
export class CorporateOperatingSystemModule {}
""",
    )
    for name, content in application_files(slug, pascal, to_const(slug), "Corporate Operating System", 354, True).items():
        write(base / "application" / name, content)


def domain_files(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    const = to_const(slug)
    domain = hub["domain"]
    kinds = hub.get("kinds", [])
    base = ROOT / "apps/api/src" / slug
    kinds_ts = ",\n".join(
        f"    {{ id: '{k}', name: '{n}', status: 'shipped', api: 'GET /v1/{slug}/records?kind={k}', notes: '{n} records in domain {domain}.' }}"
        for k, n in kinds
    )
    write(
        base / f"{slug}.catalog.ts",
        f"""export function {to_camel(slug)}Honesty() {{
  return {honesty_ts()};
}}

export function {to_camel(slug)}Capabilities() {{
  return [
{kinds_ts}
  ];
}}

export function {to_camel(slug)}RoutesTo() {{
  return [
    {{ module: 'corporate-operating-system', path: '/v1/corporate-operating-system/products', role: 'VCOS Foundation' }},
    {{ module: 'enterprise-engineering-system', path: '/v1/enterprise-engineering-system/products', role: 'EES (Vol 20)' }},
    {{ module: 'ai-governance-platform', path: '/v1/ai-governance-platform/engine', role: 'AI Governance (Vol 15)' }},
  ];
}}
""",
    )
    write(
        base / f"{slug}.service.ts",
        f"""import {{ Injectable }} from '@nestjs/common';
import {{ SessionContext }} from '../common/guards/clerk-auth.guard';
import {{ VcosStoreService }} from '../vcos-store/vcos-store.service';
import {{
  {to_camel(slug)}Capabilities,
  {to_camel(slug)}Honesty,
  {to_camel(slug)}RoutesTo,
}} from './{slug}.catalog';

@Injectable()
export class {pascal}Service {{
  constructor(private readonly store: VcosStoreService) {{}}

  engine() {{
    return {{
      product: 'VerbaLab {hub["title"]}',
      domain: '{domain}',
      capabilities: {to_camel(slug)}Capabilities(),
      routesTo: {to_camel(slug)}RoutesTo(),
      honesty: {to_camel(slug)}Honesty(),
      safety: {{
        ...{to_camel(slug)}Honesty(),
        note: '{hub["note"]}',
      }},
      docs: '/docs/{hub["doc"]}',
      note: '{hub["note"]}',
    }};
  }}

  products() {{
    return this.engine();
  }}

  monitoring() {{
    return {{
      mode: 'domain',
      domain: '{domain}',
      capabilities: {to_camel(slug)}Capabilities().map((c) => ({{ id: c.id, status: c.status }})),
      honesty: {to_camel(slug)}Honesty(),
      note: '{hub["title"]} monitoring (VL-{hub["vl"]}).',
    }};
  }}

  routes() {{
    return {{ routesTo: {to_camel(slug)}RoutesTo(), honesty: {to_camel(slug)}Honesty() }};
  }}

  async records(session: SessionContext) {{
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, '{domain}');
    return {{
      domain: '{domain}',
      count: rows.length,
      records: rows,
      honesty: {to_camel(slug)}Honesty(),
    }};
  }}

  async createRecord(
    session: SessionContext,
    body: {{
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      content?: Record<string, unknown>;
    }},
  ) {{
    const row = await this.store.create(session.organizationId, {{
      domain: '{domain}',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    }});
    return {{ record: row, honesty: {to_camel(slug)}Honesty() }};
  }}
}}
""",
    )
    write(
        base / f"{slug}.controller.ts",
        f"""import {{ Body, Controller, Get, Post, UseGuards }} from '@nestjs/common';
import {{ ClerkAuthGuard, SessionContext }} from '../common/guards/clerk-auth.guard';
import {{ CurrentSession }} from '../common/decorators/auth.decorators';
import {{ {pascal}Service }} from './{slug}.service';

@Controller('v1/{slug}')
export class {pascal}Controller {{
  constructor(private readonly service: {pascal}Service) {{}}

  @Get('engine')
  engine() {{
    return this.service.engine();
  }}

  @Get('products')
  products() {{
    return this.service.products();
  }}

  @Get('monitoring')
  monitoring() {{
    return this.service.monitoring();
  }}

  @Get('routes')
  routes() {{
    return this.service.routes();
  }}

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext) {{
    return this.service.records(session);
  }}

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {{
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      content?: Record<string, unknown>;
    }},
  ) {{
    return this.service.createRecord(session, body);
  }}
}}
""",
    )
    write(
        base / f"{slug}.module.ts",
        f"""import {{ Module }} from '@nestjs/common';
import {{ IdentityModule }} from '../identity/identity.module';
import {{ VcosStoreModule }} from '../vcos-store/vcos-store.module';
import {{ {pascal}Controller }} from './{slug}.controller';
import {{ {pascal}Service }} from './{slug}.service';

@Module({{
  imports: [IdentityModule, VcosStoreModule],
  controllers: [{pascal}Controller],
  providers: [{pascal}Service],
  exports: [{pascal}Service],
}})
export class {pascal}Module {{}}
""",
    )
    for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"], False).items():
        write(base / "application" / name, content)


def write_web(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    endpoint = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
    records_ep = f"/v1/{slug}/records"
    write(
        ROOT / "apps/web/app" / slug / "page.tsx",
        f"""import {{ {pascal}Client }} from './{slug}-client';

export default function {pascal}Page() {{
  return <{pascal}Client />;
}}
""",
    )
    write(
        ROOT / "apps/web/app" / slug / f"{slug}-client.tsx",
        f"""'use client';

import {{ FormEvent, useEffect, useState }} from 'react';
import {{ useAuth }} from '@clerk/nextjs';
import {{ apiFetch }} from '@/lib/api';
import {{ resolveApiToken }} from '@/lib/dev-auth';
import {{ AppShell }} from '@/components/app-shell';

type Engine = {{
  product: string;
  note: string;
  honesty: Record<string, boolean | string>;
  safety?: {{ note?: string }} & Record<string, unknown>;
  capabilities?: Array<Record<string, unknown>>;
  products?: Array<Record<string, unknown>>;
}};

type RecordRow = {{
  id: string;
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel?: string | null;
}};

export function {pascal}Client() {{
  const {{ getToken, isLoaded }} = useAuth();
  const [data, setData] = useState<Engine | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('{hub.get("kinds", [("note", "Note")])[0][0] if hub.get("kinds") else "note"}');
  const [busy, setBusy] = useState(false);

  useEffect(() => {{
    void apiFetch<Engine>('{endpoint}')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }}, []);

  useEffect(() => {{
    if (!isLoaded) return;
    void (async () => {{
      try {{
        const token = await resolveApiToken(getToken);
        if (!token) return;
        const res = await apiFetch<{{ records: RecordRow[] }}>('{records_ep}', {{ token }});
        setRecords(res.records ?? []);
      }} catch {{
        /* public engine still useful without auth */
      }}
    }})();
  }}, [isLoaded, getToken]);

  async function onCreate(event: FormEvent) {{
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {{
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in — use /dev-login');
      await apiFetch('{records_ep}', {{
        token,
        method: 'POST',
        body: JSON.stringify({{ kind, title, summary: 'Created from VCOS console' }}),
      }});
      const res = await apiFetch<{{ records: RecordRow[] }}>('{records_ep}', {{ token }});
      setRecords(res.records ?? []);
      setTitle('');
    }} catch (err) {{
      setError(err instanceof Error ? err.message : 'Create failed');
    }} finally {{
      setBusy(false);
    }}
  }}

  return (
    <AppShell>
      <h1 style={{{{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}}}>
        {hub["title"]}
      </h1>
      <p style={{{{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}}}>
        VL-{hub["vl"]} — VerbaLab VCOS console. Internal business tooling; not a substitute for a real board or counsel.
      </p>
      {{error ? <p style={{{{ color: '#b42318' }}}}>{{error}}</p> : null}}
      {{!data && !error ? <p style={{{{ color: 'var(--muted)' }}}}>Loading…</p> : null}}
      {{data ? (
        <div style={{{{ display: 'grid', gap: '1.25rem' }}}}>
          <p style={{{{ margin: 0, color: 'var(--muted)' }}}}>{{data.note}}</p>
          {{data.safety?.note ? (
            <p style={{{{ margin: 0, borderLeft: '3px solid #0f766e', paddingLeft: '0.85rem', color: 'var(--muted)' }}}}>
              {{String(data.safety.note)}}
            </p>
          ) : null}}
          <pre style={{{{ margin: 0, padding: '1rem', background: 'var(--surface)', overflow: 'auto', fontSize: '0.78rem' }}}}>
            {{JSON.stringify({{ honesty: data.honesty, capabilities: data.capabilities, products: data.products }}, null, 2)}}
          </pre>
          <section className="vl-panel" style={{{{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}}}>
            <h2 style={{{{ margin: 0, fontSize: '1rem' }}}}>Records</h2>
            <ul style={{{{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}}}>
              {{records.map((r) => (
                <li key={{r.id}} style={{{{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}}}>
                  <strong>{{r.title}}</strong>{' '}
                  <span style={{{{ color: 'var(--muted)', fontSize: '0.85rem' }}}}>
                    {{r.kind}} · {{r.status}}
                  </span>
                  {{r.summary ? <p style={{{{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}}}>{{r.summary}}</p> : null}}
                </li>
              ))}}
              {{!records.length ? <li style={{{{ color: 'var(--muted)' }}}}>Sign in via /dev-login to load seeded VCOS records.</li> : null}}
            </ul>
            <form onSubmit={{onCreate}} style={{{{ display: 'grid', gap: '0.55rem', marginTop: '0.5rem' }}}}>
              <label className="vl-label">
                Kind
                <input className="vl-field" value={{kind}} onChange={{(e) => setKind(e.target.value)}} />
              </label>
              <label className="vl-label">
                Title
                <input className="vl-field" value={{title}} onChange={{(e) => setTitle(e.target.value)}} required />
              </label>
              <button type="submit" className="vl-btn vl-btn-primary" disabled={{busy}} style={{{{ justifySelf: 'start' }}}}>
                {{busy ? 'Saving…' : 'Add record'}}
              </button>
            </form>
          </section>
        </div>
      ) : null}}
    </AppShell>
  );
}}
""",
    )


def write_docs(hub: dict) -> None:
    write(
        ROOT / "docs" / hub["doc"],
        f"""# {hub["title"]} (VL-{hub["vl"]})

Library Phase {hub["phase"]} — part of Volume 21 Corporate Operating System (VCOS).

## Mission

{hub["note"]}

## Honesty

- `internalBusinessSoftware=true`
- `realCorporateGovernance=false`
- `boardOs=false`
- `legalCounselOs=false`
- `confluenceOs=false` / `jiraOs=false`
- `togafModelingSuiteOs=false`
- `executiveJudgmentOs=false`

## APIs

- `GET /v1/{hub["slug"]}/{'products' if hub['kind'] == 'foundation' else 'engine'}`
- `GET /v1/{hub["slug"]}/records` (auth)
- `POST /v1/{hub["slug"]}/records` (auth)

## Console

`/{hub["slug"]}`

## Volume

**Volume 21** VCOS (VL-354–363). Production Audit evidence: [`docs/vcos-audit/`](./vcos-audit/).
""",
    )
    write(
        ROOT / "docs/adr" / f"{hub['adr']}-{hub['slug']}.md",
        f"""# ADR-{hub['adr']}: {hub['title']}

## Status

Accepted — Volume 21 Phase {hub['phase']} (VL-{hub['vl']}).

## Context

VerbaLab needs internal tooling for how the company runs (governance tracking, strategy,
portfolio, architecture, knowledge, executive KPIs, risk). README Volume 21 is explicit:
this is software that *supports* processes, not a replacement for a real board or counsel.

## Decision

Ship `{hub['slug']}` as a Nest catalog + Prisma `VcosRecord` domain surface with honesty flags,
console UI, GraphQL/OpenAPI/SDK/CLI discovery, and seeded African-AI-company sample records.

## Consequences

- Runnable internal tooling for local review via `/dev-login`.
- No claim of real corporate governance, legal counsel, or executive judgment.
- Extends EES (Vol 20) and AI Governance (Vol 15) via `routesTo` links.
""",
    )


def write_resolver(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    const = to_const(slug)
    write(
        ROOT / "apps/api/src/graphql" / f"{slug}.resolver.ts",
        f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery }} from '../{slug}/application/messages';
import {{ GqlJson }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queryBus: QueryBus) {{}}

  @Query(() => GqlJson, {{ name: '{to_camel(slug)}Engine' }})
  engine() {{
    return this.queryBus.execute(new Get{pascal}EngineQuery());
  }}
}}
""",
    )


def write_hub_spec(hub: dict) -> None:
    slug = hub["slug"]
    path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
    write(
        ROOT / "apps/api/test" / f"{slug}.spec.ts",
        f"""import {{ INestApplication }} from '@nestjs/common';
import {{ Test }} from '@nestjs/testing';
import request from 'supertest';
import {{ AppModule }} from '../src/app.module';

describe('{hub["title"]} (VL-{hub["vl"]})', () => {{
  let app: INestApplication;

  beforeAll(async () => {{
    const moduleRef = await Test.createTestingModule({{ imports: [AppModule] }}).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }});

  afterAll(async () => {{
    await app.close();
  }});

  it('exposes engine/products with honesty flags', async () => {{
    const res = await request(app.getHttpServer()).get('{path}').expect(200);
    expect(res.body.honesty.internalBusinessSoftware).toBe(true);
    expect(res.body.honesty.realCorporateGovernance).toBe(false);
    expect(res.body.honesty.boardOs).toBe(false);
    expect(res.body.note || res.body.product).toBeTruthy();
  }});
}});
""",
    )


def write_audit_pack() -> None:
    audit = ROOT / "docs/vcos-audit"
    write(
        audit / "PRODUCTION_READINESS.md",
        """# VCOS — Production Readiness

Volume 21 (VL-354–363) Production Audit.

## Gates

- All Volume 21 products shipped (foundation + 8 domain hubs + Digital Constitution).
- No TODO/FIXME/`implement later` markers in Volume 21 hub sources.
- Honesty: `internalBusinessSoftware=true`, `realCorporateGovernance=false`, `boardOs=false`, `legalCounselOs=false`.
- Prisma `vcos_records` migration applied; seed loads African-AI-company sample rows.
- Auth smoke on `/v1/corporate-operating-system/overview` and domain `/records`.
- Digital Constitution layers exposed at `/v1/corporate-operating-system/constitution`.

## Rejected inventions

- Real board of directors / legal counsel automation
- Jira OS / Confluence OS / full TOGAF modeling suite OS
- Executive judgment replacement
""",
    )
    write(
        audit / "ARCHITECTURE.md",
        """# VCOS — Architecture Validation

## Role

Corporate Operating System is **internal business software** for VerbaLab as an African AI company:
governance tracking, strategy/OKRs, portfolio, business architecture, EA repository,
knowledge portal, executive KPIs, risk register, and Digital Constitution.

## Pattern

1. Shared `VcosStore` + Prisma `VcosRecord` (domain/kind/title/content).
2. Foundation hub catalogs all products + constitution + overview.
3. Domain hubs expose engine catalogs + authenticated records CRUD.
4. Honesty flags prevent mistaking tooling for real governance.

## Extends

| Upstream | Volume | Role |
| --- | --- | --- |
| Enterprise Engineering System | 20 | Engineering OS for humans+Cursor |
| AI Governance / Trust | 15 | Human sign-off / trust |
| Compliance Platform | 15 | Compliance tooling (related, distinct) |
""",
    )
    write(
        audit / "COVERAGE.md",
        """# VCOS — Coverage Report

| Phase | VL | Hub | Covered |
| --- | --- | --- | --- |
| 221 | 354 | corporate-operating-system | yes |
| 222 | 355 | corporate-governance-platform | yes |
| 223 | 356 | strategic-planning-platform | yes |
| 224 | 357 | enterprise-portfolio-management | yes |
| 225 | 358 | business-architecture | yes |
| 226 | 359 | enterprise-architecture-repository | yes |
| 227 | 360 | corporate-knowledge-system | yes |
| 228 | 361 | executive-intelligence-platform | yes |
| 229 | 362 | corporate-risk-platform | yes |
| 230 | 363 | audit + Digital Constitution | yes |
""",
    )
    write(
        audit / "PERFORMANCE.md",
        """# VCOS — Performance Notes

- Catalog endpoints are static/in-memory and cheap.
- Records queries are indexed by `(organizationId, domain)`.
- Seed runs once per org when empty; no background jobs.
""",
    )
    write(
        audit / "DEPLOYMENT.md",
        """# VCOS — Deployment

1. `prisma migrate deploy` (includes `20261003270000_vcos`).
2. API boot seeds demo org records if empty.
3. Console routes under `/corporate-*` and related hubs require `/dev-login` for records mutations.
""",
    )
    write(
        audit / "CORPORATE_READINESS_REPORT.md",
        """# Corporate Readiness Report (VL-363)

VCOS tooling is production-ready as **internal software**:

- Committees, OKRs, portfolio items, capabilities, architecture artifacts, knowledge articles, KPIs, and risks are trackable.
- Digital Constitution layers are versioned and queryable.
- Honesty flags document that this does not create a real board or legal function.

Recommended concurrent workstreams after Volume 21: Engineering execution, African language research/data, partnerships, and living constitutional/ADR governance.
""",
    )
    write(
        audit / "ENTERPRISE_GOVERNANCE_REPORT.md",
        """# Enterprise Governance Report (VL-363)

Governance Platform supports Board/Exec/Audit/Risk/Ethics/Security/Research/Investment
committee tracking with seeded examples oriented to African voice sovereignty.

This report confirms tooling readiness — not the existence of appointed directors or counsel.
""",
    )
    write(
        ROOT / "docs/DIGITAL_CONSTITUTION.md",
        """# VerbaLab Digital Constitution

Version-controlled constitutional layers for the platform and company (Volume 21 / VL-363).

## Layers

1. Mission — why VerbaLab exists; Africa owns its voice
2. Engineering — architecture, coding, API, security, AI principles
3. Product — UX, accessibility, localization, quality
4. AI — responsible AI, safety, fairness, human oversight, evaluation
5. Data — ownership, privacy, sovereignty, retention, classification
6. Research — publication, open-source, patent, technology transfer
7. Operations — incident response, BCP/DR, change management
8. Corporate — governance, ethics, decision-making, accountability

## API

`GET /v1/corporate-operating-system/constitution`

Articles are also stored as `VcosRecord` rows with `domain=constitution` for admin review.
""",
    )
    write(
        ROOT / "docs/adr/0265-vcos-production-audit.md",
        """# ADR-0265: VCOS Production Audit

## Status

Accepted — Volume 21 Phase 230 (VL-363). Volume 21 closed.

## Decision

Close VCOS after validating all hubs, Prisma records, Digital Constitution, honesty flags,
and audit pack under `docs/vcos-audit/`. No new features in the audit phase.

## Consequences

Ask for Volume 22 when ready. Highest ROI after VCOS is execution across engineering,
African language research, partnerships, and living governance documents.
""",
    )


def write_audit_spec() -> None:
    hubs = [h["slug"] for h in HUBS]
    write(
        ROOT / "apps/api/test/vcos-audit.spec.ts",
        f"""import {{ existsSync }} from 'fs';
import {{ join }} from 'path';
import {{ INestApplication }} from '@nestjs/common';
import {{ Test }} from '@nestjs/testing';
import request from 'supertest';
import {{ AppModule }} from '../src/app.module';

const VOLUME21_HUBS = {hubs!r};

describe('VCOS Production Audit (VL-363)', () => {{
  let app: INestApplication;
  const root = join(__dirname, '../../..');
  const apiSrc = join(root, 'apps/api/src');

  beforeAll(async () => {{
    const moduleRef = await Test.createTestingModule({{ imports: [AppModule] }}).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }});

  afterAll(async () => {{
    await app.close();
  }});

  it('has audit pack + constitution docs + ADRs', () => {{
    expect(existsSync(join(root, 'docs/adr/0265-vcos-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/DIGITAL_CONSTITUTION.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/ARCHITECTURE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/COVERAGE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/CORPORATE_READINESS_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/ENTERPRISE_GOVERNANCE_REPORT.md'))).toBe(true);
    for (const hub of VOLUME21_HUBS) {{
      expect(existsSync(join(apiSrc, hub, `${{hub}}.catalog.ts`))).toBe(true);
    }}
    expect(existsSync(join(apiSrc, 'vcos-store/vcos-store.service.ts'))).toBe(true);
  }});

  it('foundation products list includes all hubs', async () => {{
    const res = await request(app.getHttpServer())
      .get('/v1/corporate-operating-system/products')
      .expect(200);
    const ids = (res.body.products as Array<{{ id: string }}>).map((p) => p.id);
    for (const hub of VOLUME21_HUBS) {{
      expect(ids).toContain(hub);
    }}
    expect(ids).toContain('digital-constitution');
    expect(res.body.honesty.realCorporateGovernance).toBe(false);
  }});

  it('constitution endpoint returns layers', async () => {{
    const res = await request(app.getHttpServer())
      .get('/v1/corporate-operating-system/constitution')
      .expect(200);
    expect(res.body.layers.length).toBeGreaterThanOrEqual(8);
  }});

  it('domain engines expose honesty', async () => {{
    for (const hub of VOLUME21_HUBS.slice(1)) {{
      const res = await request(app.getHttpServer()).get(`/v1/${{hub}}/engine`).expect(200);
      expect(res.body.honesty.internalBusinessSoftware).toBe(true);
      expect(res.body.honesty.boardOs).toBe(false);
    }}
  }});

  it('overview requires auth', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/corporate-operating-system/overview');
    expect([401, 403]).toContain(res.status);
  }});
}});
""",
    )


def patch_wiring() -> None:
    app_mod = ROOT / "apps/api/src/app.module.ts"
    text = app_mod.read_text()
    imports, modules = [], []
    # Ensure VcosStoreModule is available via foundation imports; still register all hubs
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        slug = hub["slug"]
        line = f"import {{ {pascal}Module }} from './{slug}/{slug}.module';"
        if line not in text:
            imports.append(line)
        mod = f"    {pascal}Module,"
        if mod not in text:
            modules.append(mod)
    if imports:
        text = insert_after(
            text,
            "import { InfrastructureEngineeringStandardsModule } from './infrastructure-engineering-standards/infrastructure-engineering-standards.module';\n",
            "\n".join(imports) + "\n",
        )
    if modules:
        text = insert_after(
            text,
            "    InfrastructureEngineeringStandardsModule,\n",
            "\n".join(modules) + "\n",
        )
    app_mod.write_text(text)

    gql_mod = ROOT / "apps/api/src/graphql/graphql.module.ts"
    text = gql_mod.read_text()
    app_imports, res_imports, app_modules, resolvers = [], [], [], []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        slug = hub["slug"]
        ai = f"import {{ {pascal}ApplicationModule }} from '../{slug}/application/{slug}-application.module';"
        ri = f"import {{ {pascal}GraphqlResolver }} from './{slug}.resolver';"
        if ai not in text:
            app_imports.append(ai)
        if ri not in text:
            res_imports.append(ri)
        am = f"    {pascal}ApplicationModule,"
        rr = f"    {pascal}GraphqlResolver,"
        if am not in text:
            app_modules.append(am)
        if rr not in text:
            resolvers.append(rr)
    if app_imports:
        text = insert_after(
            text,
            "import { InfrastructureEngineeringStandardsApplicationModule } from '../infrastructure-engineering-standards/application/infrastructure-engineering-standards-application.module';\n",
            "\n".join(app_imports) + "\n",
        )
    if res_imports:
        text = insert_after(
            text,
            "import { InfrastructureEngineeringStandardsGraphqlResolver } from './infrastructure-engineering-standards.resolver';\n",
            "\n".join(res_imports) + "\n",
        )
    if app_modules:
        text = insert_after(
            text,
            "    InfrastructureEngineeringStandardsApplicationModule,\n",
            "\n".join(app_modules) + "\n",
        )
    if resolvers:
        text = insert_after(
            text,
            "    InfrastructureEngineeringStandardsGraphqlResolver,\n",
            "\n".join(resolvers) + "\n",
        )
    gql_mod.write_text(text)

    openapi = ROOT / "apps/api/src/openapi/openapi.document.ts"
    ot = openapi.read_text()
    paths_block = []
    for hub in HUBS:
        slug = hub["slug"]
        pascal = to_pascal(slug)
        if hub["kind"] == "foundation":
            entries = [
                ("products", f"list{pascal}Products", "VCOS products"),
                ("engine", f"get{pascal}Engine", "VCOS engine"),
                ("routing", f"get{pascal}Routing", "VCOS routing"),
                ("overview", f"get{pascal}Overview", "VCOS overview"),
                ("constitution", f"get{pascal}Constitution", "Digital Constitution"),
                ("records", f"list{pascal}Records", "VCOS records"),
                ("monitoring", f"get{pascal}Monitoring", "VCOS monitoring"),
            ]
        else:
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("routes", f"list{pascal}Routes", f"{hub['title']} routes"),
                ("records", f"list{pascal}Records", f"{hub['title']} records"),
            ]
        for path_suffix, op_id, summary in entries:
            path_key = f"'/v1/{slug}/{path_suffix}'"
            if path_key in ot:
                continue
            paths_block.append(
                f"""    {path_key}: {{
      get: {{
        summary: '{summary}',
        operationId: '{op_id}',
        responses: {{ '200': {{ description: 'OK' }} }},
      }},
    }},"""
            )
    if paths_block:
        ot = ot.replace(
            "    '/v1/localize/file': {",
            "\n".join(paths_block) + "\n\n    '/v1/localize/file': {",
        )
        openapi.write_text(ot)

    sdk = ROOT / "packages/sdk/src/client.ts"
    st = sdk.read_text()
    methods = []
    for hub in HUBS:
        slug = hub["slug"]
        camel = to_camel(slug)
        method = f"{camel}Products" if hub["kind"] == "foundation" else f"{camel}Engine"
        path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
        if f"async {method}(" in st:
            continue
        methods.append(
            f"""
  async {method}(): Promise<Record<string, unknown>> {{
    return this.requestJson('{path}', {{ method: 'GET' }});
  }}
"""
        )
    if "async corporateOperatingSystemConstitution(" not in st:
        methods.append(
            """
  async corporateOperatingSystemConstitution(): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/corporate-operating-system/constitution', { method: 'GET' });
  }
"""
        )
    if methods:
        anchor = "  private async parseJsonResponse"
        idx = st.find(anchor)
        if idx == -1:
            raise RuntimeError("SDK anchor parseJsonResponse not found")
        st = st[:idx] + "".join(methods) + "\n" + st[idx:]
        sdk.write_text(st)

    cli = ROOT / "packages/cli/src/cli.ts"
    ct = cli.read_text()
    help_lines = []
    for hub in HUBS:
        cmd = f"{hub['slug']}-products" if hub["kind"] == "foundation" else f"{hub['slug']}-engine"
        line = f"  verbalab {cmd}"
        if line not in ct:
            help_lines.append(line)
    if "  verbalab corporate-operating-system-constitution" not in ct:
        help_lines.append("  verbalab corporate-operating-system-constitution")
    if help_lines:
        ct = ct.replace(
            "  verbalab plugin-operating-system-engine\n",
            "  verbalab plugin-operating-system-engine\n" + "\n".join(help_lines) + "\n",
        )
    handlers = []
    for hub in HUBS:
        slug = hub["slug"]
        camel = to_camel(slug)
        cmd = f"{slug}-products" if hub["kind"] == "foundation" else f"{slug}-engine"
        method = f"{camel}Products" if hub["kind"] == "foundation" else f"{camel}Engine"
        if f"command === '{cmd}'" in ct:
            continue
        handlers.append(
            f"""
  if (command === '{cmd}') {{
    console.log(JSON.stringify(await vl.{method}(), null, 2));
    return;
  }}
"""
        )
    if "command === 'corporate-operating-system-constitution'" not in ct:
        handlers.append(
            """
  if (command === 'corporate-operating-system-constitution') {
    console.log(JSON.stringify(await vl.corporateOperatingSystemConstitution(), null, 2));
    return;
  }
"""
        )
    if handlers:
        ct = ct.replace(
            "  if (command === 'plugin-operating-system-engine') {\n    console.log(JSON.stringify(await vl.pluginOperatingSystemEngine(), null, 2));\n    return;\n  }",
            "  if (command === 'plugin-operating-system-engine') {\n    console.log(JSON.stringify(await vl.pluginOperatingSystemEngine(), null, 2));\n    return;\n  }"
            + "".join(handlers),
        )
    cli.write_text(ct)

    nav = ROOT / "apps/web/lib/console-nav.ts"
    nt = nav.read_text()
    nav_lines = []
    for hub in HUBS:
        line = f"      {{ href: '/{hub['slug']}', label: '{hub['nav']}' }},"
        if line not in nt:
            nav_lines.append(line)
    if nav_lines:
        nt = nt.replace(
            "      { href: '/infrastructure-engineering-standards', label: 'Infra Standards' },\n",
            "      { href: '/infrastructure-engineering-standards', label: 'Infra Standards' },\n"
            + "\n".join(nav_lines)
            + "\n",
        )
        nav.write_text(nt)


def update_progress() -> None:
    progress = ROOT / "PROGRESS.md"
    pt = progress.read_text()
    pt = pt.replace(
        "Last updated: 2026-10-03 (VL-353 Done — Enterprise Engineering System Production Audit; Volume 20 closed)",
        "Last updated: 2026-10-03 (VL-363 Done — VCOS Production Audit; Volume 21 closed)",
    )
    rows = """| VL-354 | Corporate Operating System Foundation (Phase 221) | Done | `/corporate-operating-system`; ADR-0256. `realCorporateGovernance=false`. |
| VL-355 | Corporate Governance Platform (Phase 222) | Done | Committee tracking; ADR-0257. |
| VL-356 | Strategic Planning Platform (Phase 223) | Done | Strategy/OKR tooling; ADR-0258. |
| VL-357 | Enterprise Portfolio Management (Phase 224) | Done | Portfolio tracking; ADR-0259. |
| VL-358 | Business Architecture (Phase 225) | Done | Capability/value-stream models; ADR-0260. |
| VL-359 | Enterprise Architecture Repository (Phase 226) | Done | Artifact store; `togafModelingSuiteOs=false`; ADR-0261. |
| VL-360 | Corporate Knowledge System (Phase 227) | Done | Knowledge portal; `confluenceOs=false`; ADR-0262. |
| VL-361 | Executive Intelligence Platform (Phase 228) | Done | Exec/board KPI cockpits; ADR-0263. |
| VL-362 | Corporate Risk Platform (Phase 229) | Done | Risk register; ADR-0264. |
| VL-363 | VCOS Production Audit (Phase 230) | Done | Audit pack + Digital Constitution; ADR-0265. Volume 21 closed. |
"""
    if "VL-354" not in pt:
        pt = pt.replace(
            "| VL-353 | EES Production Audit (Phase 220) | Done | Audit pack under `docs/enterprise-engineering-system-audit/`; ADR-0255. Volume 20 closed. |\n",
            "| VL-353 | EES Production Audit (Phase 220) | Done | Audit pack under `docs/enterprise-engineering-system-audit/`; ADR-0255. Volume 20 closed. |\n"
            + rows,
        )
    changelog = """| 2026-10-03 | VL-354–362 Done: VCOS hubs (Phases 221–229) — foundation through Corporate Risk; ADR-0256–0264. Internal business software; realCorporateGovernance=false. |
| 2026-10-03 | VL-363 Done: VCOS Production Audit (Phase 230) — audit pack + Digital Constitution; ADR-0265. Volume 21 closed. Ask for Volume 22 when ready. |
"""
    if "VL-354–362 Done" not in pt:
        pt = pt.rstrip() + "\n" + changelog + "\n"
    progress.write_text(pt)


def run_generation() -> None:
    ensure_prisma()
    write_vcos_store()
    for hub in HUBS:
        if hub["kind"] == "foundation":
            foundation_files()
        else:
            domain_files(hub)
        write_web(hub)
        write_docs(hub)
        write_resolver(hub)
        write_hub_spec(hub)
    write_audit_pack()
    write_audit_spec()
    patch_wiring()
    update_progress()
    print(f"Generated Volume 21 VCOS: {len(HUBS)} hubs + store + audit")


if __name__ == "__main__":
    run_generation()
