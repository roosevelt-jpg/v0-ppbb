import { PARTNER_PLATFORMS } from '../src/partner-connectors/partner-connectors.catalog';
import { handleMcpRpc, mcpManifest } from '../src/partner-connectors/partner-connectors.mcp';
import { PARTNER_TOOLS, invokePartnerTool } from '../src/partner-connectors/partner-connectors.tools';
import { PartnerConnectorsService } from '../src/partner-connectors/partner-connectors.service';
import { CONNECTOR_CATALOG } from '../src/connector-marketplace/connector-marketplace.catalog';

describe('Partner Connectors (MCP/CLI/REST)', () => {
  it('ships first-class video + LLM platforms', () => {
    const ids = PARTNER_PLATFORMS.map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'higgsfield',
        'claude',
        'cursor',
        'chatgpt',
        'runway',
        'pika',
        'luma',
        'kling',
        'heygen',
        'synthesia',
        'custom',
      ]),
    );
    expect(PARTNER_PLATFORMS.every((p) => p.protocols.includes('mcp'))).toBe(true);
  });

  it('exposes Own AI partner tools', () => {
    const names = PARTNER_TOOLS.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'verbalab_translate',
        'verbalab_tts',
        'verbalab_stt',
        'verbalab_chat',
        'verbalab_video_voice',
        'verbalab_voice_clone',
        'verbalab_african_eval',
      ]),
    );
  });

  it('invokes translate + video-voice for Higgsfield-style partners', async () => {
    const mt = await invokePartnerTool('verbalab_translate', {
      text: 'hello',
      source: 'en',
      target: 'sw',
    });
    expect(mt.ok).toBe(true);
    if (mt.ok) expect((mt.result as { text: string }).text).toBe('habari');

    const vv = await invokePartnerTool('verbalab_video_voice', {
      title: 'hello',
      sourceLang: 'en',
      targetLang: 'sw',
      platform: 'higgsfield',
    });
    expect(vv.ok).toBe(true);
    if (vv.ok) {
      const r = vv.result as { platform: string; translatedTitle: string };
      expect(r.platform).toBe('higgsfield');
      expect(r.translatedTitle).toBe('habari');
    }
  });

  it('speaks MCP tools/list and tools/call', async () => {
    const list = await handleMcpRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    expect(list.result).toBeTruthy();
    const tools = (list.result as { tools: Array<{ name: string }> }).tools;
    expect(tools.some((t) => t.name === 'verbalab_translate')).toBe(true);

    const call = await handleMcpRpc({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'verbalab_detect_language',
        arguments: { text: 'habari yako' },
      },
    });
    expect(call.error).toBeUndefined();
    expect(JSON.stringify(call.result)).toContain('sw');

    const manifest = mcpManifest();
    expect(manifest.transport.stdio.package).toBe('@verbalab/mcp');
    expect(manifest.tools.length).toBeGreaterThan(5);
  });

  it('service engine + install + marketplace catalog wiring', () => {
    const service = new PartnerConnectorsService();
    const engine = service.engine();
    expect(engine.honesty.partnerConnectorApis).toBe(true);
    expect(engine.honesty.mcpServer).toBe(true);
    expect(engine.platforms.length).toBeGreaterThanOrEqual(10);

    const install = service.install(
      {
        organizationId: 'org_x',
        workspaceId: 'ws_x',
        userId: 'u',
        clerkUserId: 'c',
        role: 'owner',
      },
      { platformId: 'higgsfield', webhookUrl: 'https://example.test/hook' },
    );
    expect(install.installation.platformId).toBe('higgsfield');
    expect(install.installation.scopes).toContain('verbalab_translate');

    const partnerKeys = CONNECTOR_CATALOG.filter((c) => c.key.startsWith('partner.'));
    expect(partnerKeys.length).toBeGreaterThanOrEqual(8);
    expect(partnerKeys.every((c) => c.api)).toBe(true);
  });
});
