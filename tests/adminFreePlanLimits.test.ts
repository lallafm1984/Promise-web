import { describe, expect, it } from 'vitest';

import {
  getPriorityFreePlanLimits,
  isAdminFreePlanLimitsTokenAllowed,
  SUPABASE_FREE_PLAN_LIMITS,
} from '@/lib/adminFreePlanLimits';

describe('isAdminFreePlanLimitsTokenAllowed', () => {
  it('allows the configured admin token after trimming whitespace', () => {
    expect(isAdminFreePlanLimitsTokenAllowed('  admin-page-token-1234567890  ', 'admin-page-token-1234567890')).toBe(
      true,
    );
  });

  it('denies missing, short, or mismatched tokens', () => {
    expect(isAdminFreePlanLimitsTokenAllowed('admin-page-token-1234567890', undefined)).toBe(false);
    expect(isAdminFreePlanLimitsTokenAllowed('short', 'short')).toBe(false);
    expect(isAdminFreePlanLimitsTokenAllowed('admin-page-token-1234567890', 'different-admin-token-123456')).toBe(
      false,
    );
  });
});

describe('SUPABASE_FREE_PLAN_LIMITS', () => {
  it('tracks the free plan limits that matter most to Promise launch risk', () => {
    expect(SUPABASE_FREE_PLAN_LIMITS.map((limit) => limit.id)).toEqual([
      'database-size',
      'egress',
      'realtime-peak-connections',
      'realtime-messages',
      'monthly-active-users',
      'storage-size',
      'edge-functions',
    ]);
  });

  it('marks database, egress, and realtime peak connections as priority alert items', () => {
    expect(getPriorityFreePlanLimits().map((limit) => limit.id)).toEqual([
      'database-size',
      'egress',
      'realtime-peak-connections',
    ]);
  });
});
