import { describe, expect, it } from 'vitest';

import {
  formatUsageNumber,
  getUsageLevel,
  parseSupabaseProjectRef,
  sumUsageApiCounts,
} from '@/lib/adminSupabaseUsage';

describe('parseSupabaseProjectRef', () => {
  it('extracts the project ref from a hosted Supabase URL', () => {
    expect(parseSupabaseProjectRef('https://uhbbhhlzfjnlqguzvlzw.supabase.co')).toBe('uhbbhhlzfjnlqguzvlzw');
  });

  it('returns null for non-Supabase URLs', () => {
    expect(parseSupabaseProjectRef('http://127.0.0.1:54321')).toBeNull();
  });
});

describe('getUsageLevel', () => {
  it('classifies values below watch, above watch, and above action thresholds', () => {
    expect(getUsageLevel(20, { watch: 60, action: 80 })).toBe('ok');
    expect(getUsageLevel(70, { watch: 60, action: 80 })).toBe('watch');
    expect(getUsageLevel(90, { watch: 60, action: 80 })).toBe('action');
  });
});

describe('sumUsageApiCounts', () => {
  it('sums Supabase Management API usage rows into one readable total', () => {
    expect(
      sumUsageApiCounts({
        result: [
          {
            timestamp: '2026-06-24T00:00:00Z',
            total_auth_requests: 10,
            total_realtime_requests: 20,
            total_rest_requests: 30,
            total_storage_requests: 40,
          },
          {
            timestamp: '2026-06-24T01:00:00Z',
            total_auth_requests: 1,
            total_realtime_requests: 2,
            total_rest_requests: 3,
            total_storage_requests: 4,
          },
        ],
      }),
    ).toEqual({
      auth: 11,
      realtime: 22,
      rest: 33,
      storage: 44,
      total: 110,
    });
  });
});

describe('formatUsageNumber', () => {
  it('formats compact Korean dashboard numbers', () => {
    expect(formatUsageNumber(950)).toBe('950');
    expect(formatUsageNumber(15200)).toBe('1.52만');
    expect(formatUsageNumber(1280000)).toBe('128만');
  });
});
