import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const webApp = join(__dirname, '../../web/app');
const apiSrc = join(__dirname, '../src');

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(tsx|ts)$/.test(name)) acc.push(full);
  }
  return acc;
}

/** Engine paths the console actually calls. */
function consoleEnginePaths(): string[] {
  const paths = new Set<string>();
  for (const file of walk(webApp)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/['"`](\/v1\/[a-z0-9-]+(?:\/[a-z0-9-]+)*)\/engine['"`]/g)) {
      paths.add(`${m[1]}/engine`);
    }
    for (const m of text.matchAll(/apiBase=["'](\/v1\/[a-z0-9-]+)["']/g)) {
      paths.add(`${m[1]}/engine`);
    }
  }
  return [...paths].sort();
}

/** Controllers that expose GET …/engine */
function controllerEnginePaths(): string[] {
  const paths = new Set<string>();
  for (const file of walk(apiSrc).filter((f) => f.endsWith('.controller.ts'))) {
    const text = readFileSync(file, 'utf8');
    const ctrl = text.match(/@Controller\(['"`]([^'"`]+)['"`]\)/);
    if (!ctrl) continue;
    const base = ctrl[1].replace(/\/$/, '');
    if (/@Get\(\s*['"`]engine['"`]\s*\)/.test(text)) {
      paths.add(`/${base}/engine`.replace(/\/+/g, '/'));
    }
    // Controllers mounted at `v1` with compound paths like `translate/engine`
    for (const m of text.matchAll(/@Get\(\s*['"`]([a-z0-9-]+(?:\/[a-z0-9-]+)*)\/engine['"`]\s*\)/g)) {
      paths.add(`/${base}/${m[1]}/engine`.replace(/\/+/g, '/'));
    }
  }
  return [...paths].sort();
}

describe('Console engine routes are wired in the API', () => {
  it('every Moonshot/console engine fetch has a matching Nest controller', () => {
    const needed = consoleEnginePaths();
    const available = new Set(controllerEnginePaths());
    expect(needed.length).toBeGreaterThan(20);

    const missing = needed.filter((p) => !available.has(p));
    expect(missing, `Missing API engine routes:\n${missing.join('\n')}`).toEqual([]);
  });

  it('Meeting Transcription and Verba Voice engines are registered', () => {
    const available = new Set(controllerEnginePaths());
    expect(available.has('/v1/meeting-transcription/engine')).toBe(true);
    expect(available.has('/v1/verba-voice/engine')).toBe(true);
  });
});
