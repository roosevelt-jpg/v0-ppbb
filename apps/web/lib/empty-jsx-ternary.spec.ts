import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const webRoot = join(__dirname, '..');

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(tsx|jsx)$/.test(name)) acc.push(full);
  }
  return acc;
}

describe('JSX empty ternaries', () => {
  it('does not leave empty engine ? () : null / && () blocks that break Next builds', () => {
    const bad: string[] = [];
    for (const file of walk(webRoot)) {
      const text = readFileSync(file, 'utf8');
      if (/\?\s*\(\s*\)\s*:/.test(text) || /&&\s*\(\s*\)/.test(text)) {
        bad.push(file.replace(webRoot + '/', ''));
      }
    }
    expect(bad, `Empty JSX conditionals:\n${bad.join('\n')}`).toEqual([]);
  });
});
