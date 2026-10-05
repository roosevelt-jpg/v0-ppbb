import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  EnterpriseSearchMode,
  enterpriseSearchCatalog,
} from './enterprise-search.catalog';

type SearchHit = {
  rank: number;
  id: string;
  documentId: string;
  filename: string;
  ordinal: number;
  score: number;
  content: string;
  collection?: string;
  contentKind?: string;
  tags?: string[];
  source: 'keyword' | 'semantic' | 'hybrid';
};

@Injectable()
export class EnterpriseSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledge: KnowledgeService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return enterpriseSearchCatalog();
  }

  modes() {
    const c = this.engine();
    return {
      modes: c.modes.map((id) => ({
        id,
        notes:
          id === 'hybrid'
            ? 'Light RRF of keyword + semantic — not BM25/Elastic hybrid OS.'
            : id === 'semantic'
              ? 'pgvector cosine via Knowledge embeddings'
              : id === 'image'
                ? 'Caption/OCR text path — filter contentKind=image when present.'
                : id === 'voice'
                  ? 'Speech transcript query path — paste STT text as query.'
                  : id === 'translation'
                    ? 'Cross-lingual via translated query text then hybrid search.'
                    : 'ILIKE substring match on chunk content.',
      })),
      deferred: ['bm25_parity'],
      note: 'Enterprise Search modes including sandbox image/voice/translation paths.',
    };
  }

  private assertMode(mode: string): EnterpriseSearchMode {
    const allowed: EnterpriseSearchMode[] = [
      'keyword',
      'semantic',
      'hybrid',
      'image',
      'voice',
      'translation',
    ];
    if (!allowed.includes(mode as EnterpriseSearchMode)) {
      throw new ApiException(
        'validation_error',
        `mode must be one of: ${allowed.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return mode as EnterpriseSearchMode;
  }

  private docFilter(input: {
    organizationId: string;
    workspaceId: string;
    collection?: string;
    tag?: string;
    contentKind?: string;
    documentId?: string;
  }): Prisma.KnowledgeDocumentWhereInput {
    return {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      status: 'ready',
      ...(input.collection ? { collection: input.collection } : {}),
      ...(input.contentKind ? { contentKind: input.contentKind } : {}),
      ...(input.documentId ? { id: input.documentId } : {}),
      ...(input.tag ? { tags: { has: input.tag.trim().toLowerCase() } } : {}),
    };
  }

  private async keywordHits(input: {
    organizationId: string;
    workspaceId: string;
    query: string;
    k: number;
    collection?: string;
    tag?: string;
    contentKind?: string;
    documentId?: string;
  }): Promise<Omit<SearchHit, 'rank'>[]> {
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        content: { contains: input.query, mode: 'insensitive' },
        document: this.docFilter(input),
      },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            collection: true,
            contentKind: true,
            tags: true,
          },
        },
      },
      take: Math.min(input.k * 3, 60),
      orderBy: { ordinal: 'asc' },
    });

    const q = input.query.toLowerCase();
    return chunks
      .map((c) => {
        const lower = c.content.toLowerCase();
        const idx = lower.indexOf(q);
        const score = idx < 0 ? 0.1 : Math.max(0.15, 1 - idx / Math.max(lower.length, 1));
        return {
          id: c.id,
          documentId: c.documentId,
          filename: c.document.filename,
          ordinal: c.ordinal,
          score,
          content: c.content,
          collection: c.document.collection,
          contentKind: c.document.contentKind,
          tags: c.document.tags,
          source: 'keyword' as const,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, input.k);
  }

  private async semanticHits(input: {
    organizationId: string;
    workspaceId: string;
    query: string;
    k: number;
    collection?: string;
    tag?: string;
    contentKind?: string;
    documentId?: string;
    minScore?: number;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }): Promise<Omit<SearchHit, 'rank'>[]> {
    const needsMetaFilter = Boolean(input.collection || input.tag || input.contentKind);
    const vector = await this.knowledge.searchVectors({
      query: input.query,
      k: needsMetaFilter ? Math.min(input.k * 4, 40) : input.k,
      documentId: input.documentId,
      minScore: input.minScore,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });

    let hits = vector.hits.map((h) => ({
      id: h.id,
      documentId: h.documentId,
      filename: h.filename,
      ordinal: h.ordinal,
      score: h.score,
      content: h.content,
      source: 'semantic' as const,
    }));

    if (needsMetaFilter && hits.length > 0) {
      const docIds = [...new Set(hits.map((h) => h.documentId))];
      const docs = await this.prisma.knowledgeDocument.findMany({
        where: {
          id: { in: docIds },
          ...this.docFilter(input),
        },
        select: { id: true, collection: true, contentKind: true, tags: true, filename: true },
      });
      const allowed = new Map(docs.map((d) => [d.id, d]));
      hits = hits
        .filter((h) => allowed.has(h.documentId))
        .map((h) => {
          const d = allowed.get(h.documentId)!;
          return {
            ...h,
            filename: d.filename,
            collection: d.collection,
            contentKind: d.contentKind,
            tags: d.tags,
          };
        })
        .slice(0, input.k);
    }

    return hits.slice(0, input.k);
  }

  private rrfMerge(
    keyword: Omit<SearchHit, 'rank'>[],
    semantic: Omit<SearchHit, 'rank'>[],
    k: number,
  ): Omit<SearchHit, 'rank'>[] {
    const scores = new Map<string, Omit<SearchHit, 'rank'> & { rrf: number }>();
    const add = (list: Omit<SearchHit, 'rank'>[], weight: number) => {
      list.forEach((hit, i) => {
        const prev = scores.get(hit.id);
        const rrf = weight / (60 + i + 1);
        if (!prev) {
          scores.set(hit.id, { ...hit, source: 'hybrid', rrf, score: rrf });
        } else {
          prev.rrf += rrf;
          prev.score = prev.rrf;
          prev.source = 'hybrid';
        }
      });
    };
    add(keyword, 1);
    add(semantic, 1);
    return [...scores.values()]
      .sort((a, b) => b.rrf - a.rrf)
      .slice(0, k)
      .map(({ rrf: _rrf, ...rest }) => rest);
  }

  async search(input: {
    query: string;
    mode?: string;
    k?: number;
    collection?: string;
    tag?: string;
    contentKind?: string;
    documentId?: string;
    minScore?: number;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const query = input.query?.trim();
    if (!query) {
      throw new ApiException('validation_error', 'query is required', HttpStatus.BAD_REQUEST);
    }
    const mode = this.assertMode(input.mode ?? 'hybrid');
    const k = Math.min(Math.max(input.k ?? 8, 1), 20);
    const contentKind =
      mode === 'image'
        ? input.contentKind ?? 'image'
        : mode === 'voice'
          ? input.contentKind ?? 'audio'
          : input.contentKind;

    let raw: Omit<SearchHit, 'rank'>[] = [];
    if (mode === 'keyword') {
      raw = await this.keywordHits({ ...input, query, k, contentKind });
    } else if (mode === 'semantic') {
      raw = await this.semanticHits({ ...input, query, k, contentKind });
    } else if (mode === 'image' || mode === 'voice' || mode === 'translation') {
      const [kw, sem] = await Promise.all([
        this.keywordHits({ ...input, query, k, contentKind }),
        this.semanticHits({ ...input, query, k, contentKind }),
      ]);
      raw = this.rrfMerge(kw, sem, k);
    } else {
      const [kw, sem] = await Promise.all([
        this.keywordHits({ ...input, query, k, contentKind }),
        this.semanticHits({ ...input, query, k, contentKind }),
      ]);
      raw = this.rrfMerge(kw, sem, k);
    }

    const hits: SearchHit[] = raw.map((h, i) => ({ ...h, rank: i + 1 }));

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'enterprise_search.searched',
      route: 'POST /v1/enterprise-search/search',
      ip: input.ip,
      metadata: {
        mode,
        hits: hits.length,
        k,
        collection: input.collection ?? null,
        tag: input.tag ?? null,
        contentKind: input.contentKind ?? null,
        documentId: input.documentId ?? null,
      },
    });

    return {
      query,
      mode,
      namespace: input.workspaceId,
      filters: {
        collection: input.collection ?? null,
        tag: input.tag ?? null,
        contentKind: contentKind ?? null,
        documentId: input.documentId ?? null,
      },
      hits,
      honesty: this.engine().honesty,
      note:
        mode === 'image'
          ? 'Sandbox image search via caption/OCR text over knowledge chunks. Not multimodal encoder OS.'
          : mode === 'voice'
            ? 'Sandbox voice search via STT transcript query text. Not live mic search OS.'
            : mode === 'translation'
              ? 'Sandbox translation search — pass already-translated query text for cross-lingual retrieval.'
              : mode === 'hybrid'
                ? 'Light hybrid RRF over keyword + pgvector semantic. Not Elastic/BM25 OS.'
                : mode === 'semantic'
                  ? 'Semantic search via pgvector over chunks.'
                  : 'Keyword ILIKE search over workspace knowledge chunks.',
    };
  }

  async suggest(input: {
    q: string;
    organizationId: string;
    workspaceId: string;
    limit?: number;
  }) {
    const q = input.q?.trim() ?? '';
    if (!q) {
      return { suggestions: [], note: 'Pass q= for filename/tag prefix suggestions.' };
    }
    const limit = Math.min(Math.max(input.limit ?? 8, 1), 20);
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        OR: [
          { filename: { contains: q, mode: 'insensitive' } },
          { tags: { has: q.toLowerCase() } },
          { collection: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { filename: true, tags: true, collection: true },
      take: 40,
      orderBy: { updatedAt: 'desc' },
    });

    const suggestions: Array<{ type: string; value: string }> = [];
    const seen = new Set<string>();
    const push = (type: string, value: string) => {
      const key = `${type}:${value}`;
      if (seen.has(key) || !value) return;
      seen.add(key);
      suggestions.push({ type, value });
    };

    for (const d of docs) {
      push('filename', d.filename);
      push('collection', d.collection);
      for (const t of d.tags) {
        if (t.includes(q.toLowerCase())) push('tag', t);
      }
      if (suggestions.length >= limit) break;
    }

    return {
      q,
      suggestions: suggestions.slice(0, limit),
      note: 'Prefix/substring suggestions from workspace docs — not an autocomplete OS.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [documents, chunks, searches] = await Promise.all([
      this.prisma.knowledgeDocument.count({ where: { organizationId, workspaceId } }),
      this.prisma.knowledgeChunk.count({ where: { organizationId, workspaceId } }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'enterprise_search.searched',
          createdAt: { gte: since },
        },
      }),
    ]);
    return {
      workspace: { organizationId, workspaceId },
      documents,
      chunks,
      searchesLast30d: searches,
      note: 'Workspace-scoped Enterprise Search analytics.',
    };
  }

  async monitoring(organizationId: string, workspaceId: string) {
    const engine = this.engine();
    const analytics = await this.analytics(organizationId, workspaceId);
    return {
      ...analytics,
      honesty: engine.honesty,
      deferred: engine.capabilities
        .filter((c) => (c.status as string) === 'deferred')
        .map((c) => c.id),
      links: engine.links,
    };
  }
}
