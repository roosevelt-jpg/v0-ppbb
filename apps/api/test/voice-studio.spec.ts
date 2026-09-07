import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../../..');

describe('Voice Studio (VL-120)', () => {
  it('ships Voice Studio console + AppShell label', () => {
    const client = readFileSync(join(root, 'apps/web/app/audio/audio-client.tsx'), 'utf8');
    expect(client).toContain('Voice Studio');
    expect(client).toContain('LANG_PRESETS');
    expect(client).toContain('disableClone');
    expect(client).toContain("code: 'sw'");
    expect(client).toContain('samples');

    const shell = readFileSync(join(root, 'apps/web/components/app-shell.tsx'), 'utf8');
    expect(shell).toContain("label: 'Voice Studio'");
  });

  it('documents get-by-id and studio in OpenAPI + ADR', () => {
    const openapi = readFileSync(join(root, 'apps/api/src/openapi/openapi.document.ts'), 'utf8');
    expect(openapi).toContain("'/v1/voice-clones/{id}'");
    expect(openapi).toContain('getVoiceClone');
    expect(existsSync(join(root, 'docs/adr/0044-african-voice-studio.md'))).toBe(true);
  });
});
