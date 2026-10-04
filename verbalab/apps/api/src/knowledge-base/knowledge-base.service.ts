import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  KNOWLEDGE_CONTENT_KINDS,
  knowledgeBaseCatalog,
} from './knowledge-base.catalog';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledge: KnowledgeService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return knowledgeBaseCatalog();
  }

  contentKinds() {
    return {
      kinds: KNOWLEDGE_CONTENT_KINDS.map((id) => ({ id })),
      deferred: ['video', 'audio', 'powerpoint', 'excel', 'web_crawl'],
      note: 'Shipped text kinds + OCR caption image path for Full media CMS/Office decks deferred.',
    };
  }

  async collections(organizationId: string, workspaceId: string) {
    const grouped = await this.prisma.knowledgeDocument.groupBy({
      by: ['collection'],
      where: { organizationId, workspaceId },
      _count: { _all: true },
      orderBy: { collection: 'asc' },
    });
    return {
      collections: grouped.map((g) => ({
        id: g.collection,
        documentCount: g._count._all,
      })),
      note: 'Logical collections within this workspace only (org+workspace scoped).',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const [documents, ready, failed, chunks] = await Promise.all([
      this.prisma.knowledgeDocument.count({ where: { organizationId, workspaceId } }),
      this.prisma.knowledgeDocument.count({
        where: { organizationId, workspaceId, status: 'ready' },
      }),
      this.prisma.knowledgeDocument.count({
        where: { organizationId, workspaceId, status: 'failed' },
      }),
      this.prisma.knowledgeChunk.count({ where: { organizationId, workspaceId } }),
    ]);
    return {
      workspace: { organizationId, workspaceId },
      documents,
      ready,
      failed,
      chunks,
      note: 'Workspace-scoped Knowledge Base counts.',
    };
  }

  async monitoring(organizationId: string, workspaceId: string) {
    const engine = this.engine();
    const analytics = await this.analytics(organizationId, workspaceId);
    return {
      ...analytics,
      honesty: engine.honesty,
      deferred: engine.capabilities
        .filter((c) => c.status === 'deferred')
        .map((c) => c.id),
      links: engine.links,
    };
  }

  listDocuments(
    organizationId: string,
    workspaceId: string,
    filters?: { collection?: string; tag?: string; contentKind?: string },
  ) {
    return this.knowledge.list(organizationId, workspaceId, filters);
  }

  getDocument(organizationId: string, workspaceId: string, id: string) {
    return this.knowledge.get(organizationId, workspaceId, id);
  }

  async reviseMeta(input: {
    organizationId: string;
    workspaceId: string;
    id: string;
    userId?: string;
    ip?: string;
    collection?: string;
    tags?: string[];
    contentKind?: string;
  }) {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!doc) {
      throw new ApiException('not_found', 'Knowledge document not found', HttpStatus.NOT_FOUND);
    }

    const tags =
      input.tags === undefined
        ? undefined
        : [
            ...new Set(
              input.tags
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean)
                .map((t) => t.slice(0, 48)),
            ),
          ].slice(0, 32);

    if (
      input.contentKind !== undefined &&
      !(KNOWLEDGE_CONTENT_KINDS as readonly string[]).includes(input.contentKind)
    ) {
      throw new ApiException(
        'validation_error',
        `contentKind must be one of: ${KNOWLEDGE_CONTENT_KINDS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: {
        version: { increment: 1 },
        ...(input.collection !== undefined
          ? { collection: (input.collection.trim() || 'default').slice(0, 64) }
          : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(input.contentKind !== undefined ? { contentKind: input.contentKind } : {}),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_base.document_revise_meta',
      route: 'POST /v1/knowledge-base/documents/:id/revise-meta',
      ip: input.ip,
      metadata: {
        documentId: updated.id,
        version: updated.version,
        collection: updated.collection,
        contentKind: updated.contentKind,
      },
    });

    return this.knowledge.get(input.organizationId, input.workspaceId, updated.id);
  }

  /** Light approval gate — tags document approved/rejected without CMS OS. */
  async setApproval(input: {
    organizationId: string;
    workspaceId: string;
    id: string;
    status: 'approved' | 'rejected' | 'pending';
    userId?: string;
    ip?: string;
    note?: string;
  }) {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!doc) {
      throw new ApiException('not_found', 'Knowledge document not found', HttpStatus.NOT_FOUND);
    }
    const tags = new Set((doc.tags ?? []).map((t) => t.toLowerCase()));
    tags.delete('approval:approved');
    tags.delete('approval:rejected');
    tags.delete('approval:pending');
    tags.add(`approval:${input.status}`);
    const updated = await this.prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: {
        tags: [...tags].slice(0, 32),
        version: { increment: 1 },
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_base.document_approval',
      route: 'POST /v1/knowledge-base/documents/:id/approve',
      ip: input.ip,
      metadata: {
        documentId: updated.id,
        approval: input.status,
        note: input.note ?? null,
      },
    });
    return {
      documentId: updated.id,
      approval: input.status,
      tags: updated.tags,
      version: updated.version,
      note: 'Light approval tag — not an enterprise CMS approval OS.',
    };
  }
}
