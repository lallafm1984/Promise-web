import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function readSource(path: string) {
  return readFileSync(join(repoRoot, path), 'utf8');
}

describe('ResponseForm surface', () => {
  it('does not render the response deadline notice inside the card summary', () => {
    const source = readSource('src/components/ResponseForm.tsx');

    expect(source).not.toContain('RESPONSE_WINDOW_NOTICE');
    expect(source).not.toContain('formatResponseDeadline');
    expect(source).not.toContain('app-danger-soft');
    expect(source).toContain('!isExpired(card)');
  });
});
