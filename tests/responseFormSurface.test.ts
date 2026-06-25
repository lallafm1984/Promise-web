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
    expect(source).toContain('mx-auto flex w-full min-w-0 max-w-[430px]');
    expect(source).not.toContain('px-4 py-4 sm:py-8');
  });

  it('does not render the response deadline notice inside the card summary', () => {
    const source = readSource('src/components/ResponseForm.tsx');

    expect(source).not.toContain('RESPONSE_WINDOW_NOTICE');
    expect(source).not.toContain('formatResponseDeadline');
    expect(source).not.toContain('app-danger-soft');
    expect(source).toContain('!isExpired(card)');
  });

  it('keeps mobile form controls constrained inside the response card width', () => {
    const source = readSource('src/components/ResponseForm.tsx');

    expect(source).toContain('app-card-shadow w-full min-w-0 rounded-[20px]');
    expect(source).toContain('grid min-w-0 gap-3');
    expect(source).toContain('grid min-w-0 gap-1.5');
    expect(source).toContain('w-full min-w-0 rounded-[14px]');
    expect(source).toContain('grid min-w-0 grid-cols-2 gap-2');
    expect(source).toContain('flex min-h-12 w-full min-w-0 flex-1');
    expect(source).toContain('mt-4 flex min-h-12 w-full min-w-0');
  });
});
