import { knowledgeProductCatalog } from '../src/knowledge-cloud/knowledge-products.catalog';
import { intelligenceProductCatalog } from '../src/intelligence-cloud/intelligence-products.catalog';
import { AgentIntelligenceService } from '../src/agent-intelligence/agent-intelligence.service';
import { AiObservabilityService } from '../src/ai-observability/ai-observability.service';
import { knowledgeBaseCatalog } from '../src/knowledge-base/knowledge-base.catalog';
import { memoryCloudCatalog } from '../src/memory-cloud/memory-cloud.catalog';
import { vectorCloudCatalog } from '../src/vector-cloud/vector-cloud.catalog';
import { aiOrchestrationCatalog } from '../src/ai-orchestration/ai-orchestration.catalog';

describe('Knowledge + Intelligence Cloud shipped closeout', () => {
  it('marks all Knowledge Cloud hub products shipped with APIs/consoles', () => {
    const rows = knowledgeProductCatalog();
    expect(rows.every((r) => r.status === 'shipped')).toBe(true);
    expect(rows.every((r) => r.api && r.console)).toBe(true);
  });

  it('marks all Intelligence Cloud hub products shipped with APIs/consoles', () => {
    const rows = intelligenceProductCatalog();
    expect(rows.every((r) => r.status === 'shipped')).toBe(true);
    const agent = rows.find((r) => r.id === 'agent-intelligence')!;
    const obs = rows.find((r) => r.id === 'ai-observability')!;
    expect(agent.api).toBe('GET /v1/agent-intelligence/engine');
    expect(agent.console).toBe('/agent-intelligence');
    expect(obs.api).toBe('GET /v1/ai-observability/engine');
    expect(obs.console).toBe('/ai-observability');
  });

  it('ships KB approval + media OCR + memory sweeper + vector hybrid wiring', () => {
    const kb = knowledgeBaseCatalog();
    expect(kb.capabilities.find((c) => c.id === 'approval-workflow')?.status).toBe('shipped');
    expect(kb.capabilities.find((c) => c.id === 'media-ingest')?.status).toBe('shipped');
    expect(kb.capabilities.every((c) => c.status !== 'partial')).toBe(true);
    expect(kb.honesty.approvalWorkflow).toBe(true);
    const mem = memoryCloudCatalog();
    expect(mem.architecture.retentionSweeper).toBe(true);
    expect(mem.honesty.automatedRetentionSweeper).toBe(true);
    const vec = vectorCloudCatalog();
    expect(vec.capabilities.find((c) => c.id === 'hybrid-search')?.status).toBe('shipped');
    const orch = aiOrchestrationCatalog();
    expect(orch.capabilities.find((c) => c.id === 'model-chaining')?.status).toBe('shipped');
  });

  it('agent intelligence + ai observability engines load', () => {
    const agentOs = {
      agentOsEngine: () => ({ id: 'agent-os', fullAgentOs: true, multiAgentOs: true }),
    };
    const agent = new AgentIntelligenceService({} as never, agentOs as never).engine();
    expect(agent.honesty.fullAgentOs).toBe(true);
    expect(agent.honesty.multiAgentOs).toBe(true);
    expect(agent.capabilities.some((c: { id: string }) => c.id === 'partner-tools')).toBe(true);
    expect(agent.capabilities.some((c: { id: string; status: string }) => c.id === 'full-agent-os' && c.status === 'shipped')).toBe(true);

    const obs = new AiObservabilityService({} as never).engine();
    expect(obs.honesty.datadogOs).toBe(false);
    expect(obs.surfaces.length).toBeGreaterThan(5);
  });
});
