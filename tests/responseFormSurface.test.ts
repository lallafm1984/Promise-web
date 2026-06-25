import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function readSource(path: string) {
  return readFileSync(join(repoRoot, path), 'utf8');
}

describe('ResponseForm surface', () => {
  it('centers the public response page evenly on mobile and desktop', () => {
    const source = readSource('src/app/c/[token]/page.tsx');

    expect(source).toContain('flex min-h-dvh items-start justify-center');
    expect(source).toContain('px-5');
    expect(source).toContain('md:items-center');
    expect(source).toContain('md:py-10');
    expect(source).toContain('mx-auto flex w-full max-w-[430px]');
    expect(source).not.toContain('px-4 py-4 sm:py-8');
  });

  it('does not render the response deadline notice inside the card summary', () => {
    const source = readSource('src/components/ResponseForm.tsx');

    expect(source).not.toContain('RESPONSE_WINDOW_NOTICE');
    expect(source).not.toContain('formatResponseDeadline');
    expect(source).not.toContain('app-danger-soft');
    expect(source).toContain('!isExpired(card)');
  });
});
