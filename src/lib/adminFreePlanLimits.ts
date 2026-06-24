import { createHash, timingSafeEqual } from 'node:crypto';

export const ADMIN_FREE_PLAN_LIMITS_TOKEN_ENV = 'ADMIN_LIMITS_PAGE_TOKEN';
export const SUPABASE_FREE_PLAN_SOURCE_CHECKED_AT = '2026-06-24';

export type FreePlanLimitSeverity = 'priority' | 'watch';

export interface SupabaseFreePlanLimit {
  id: string;
  label: string;
  quota: string;
  watchAt: string;
  actionAt: string;
  severity: FreePlanLimitSeverity;
  promiseImpact: string;
  operatorAction: string;
  sourceLabel: string;
  sourceUrl: string;
}

const MIN_ADMIN_TOKEN_LENGTH = 24;

export const SUPABASE_FREE_PLAN_LIMITS: SupabaseFreePlanLimit[] = [
  {
    id: 'database-size',
    label: 'Database size',
    quota: '500 MB',
    watchAt: '300 MB',
    actionAt: '400 MB',
    severity: 'priority',
    promiseImpact: '약속 카드, 응답, 알림 outbox가 모두 DB에 쌓입니다.',
    operatorAction: 'delivered/failed 알림 정리와 오래된 임시 카드 정리를 먼저 확인하고, 400 MB부터 Pro 전환을 준비합니다.',
    sourceLabel: 'Supabase billing quotas',
    sourceUrl: 'https://supabase.com/docs/guides/platform/billing-on-supabase',
  },
  {
    id: 'egress',
    label: 'Egress',
    quota: '5 GB / month',
    watchAt: '3 GB',
    actionAt: '4 GB',
    severity: 'priority',
    promiseImpact: '공유 응답 페이지 조회, 모바일 동기화, Auth/API 응답 트래픽이 포함됩니다.',
    operatorAction: '응답 페이지 과다 접근과 불필요한 새로고침을 확인하고, 광고/마케팅 전에 Pro 전환을 준비합니다.',
    sourceLabel: 'Supabase egress usage',
    sourceUrl: 'https://supabase.com/docs/guides/platform/manage-your-usage/egress',
  },
  {
    id: 'realtime-peak-connections',
    label: 'Realtime peak connections',
    quota: '200 concurrent',
    watchAt: '120',
    actionAt: '160',
    severity: 'priority',
    promiseImpact: '모바일 앱이 켜져 있는 사용자 수에 가장 직접적으로 영향을 받습니다.',
    operatorAction: '동시 연결 160 이상이면 무료 플랜 지속이 위험하므로 Pro 전환 또는 Realtime 사용 축소를 결정합니다.',
    sourceLabel: 'Supabase realtime peak connections',
    sourceUrl: 'https://supabase.com/docs/guides/platform/manage-your-usage/realtime-peak-connections',
  },
  {
    id: 'realtime-messages',
    label: 'Realtime messages',
    quota: '2,000,000 / month',
    watchAt: '1,200,000',
    actionAt: '1,600,000',
    severity: 'watch',
    promiseImpact: '현재는 mobile_sync_versions 사용자별 필터로 줄여 둔 상태라 peak connections보다 늦게 걸릴 가능성이 큽니다.',
    operatorAction: '메시지가 빠르게 늘면 변경 이벤트를 더 묶거나 foreground refresh 비중을 늘립니다.',
    sourceLabel: 'Supabase realtime pricing',
    sourceUrl: 'https://supabase.com/docs/guides/realtime/pricing',
  },
  {
    id: 'monthly-active-users',
    label: 'Monthly active users',
    quota: '50,000 MAU',
    watchAt: '30,000',
    actionAt: '40,000',
    severity: 'watch',
    promiseImpact: '초기 Promise 출시에서는 보통 DB/Realtime/egress보다 늦게 도달합니다.',
    operatorAction: 'MAU 4만 전후부터 Auth 초대/공유 유입 추이를 보고 Pro 전환 일정을 잡습니다.',
    sourceLabel: 'Supabase pricing',
    sourceUrl: 'https://supabase.com/pricing',
  },
  {
    id: 'storage-size',
    label: 'Storage size',
    quota: '1 GB',
    watchAt: '600 MB',
    actionAt: '800 MB',
    severity: 'watch',
    promiseImpact: '현재 Promise는 큰 파일 저장 경로가 거의 없어 위험도가 낮습니다.',
    operatorAction: '이미지 업로드 기능을 열기 전까지는 월 1회 점검으로 충분합니다.',
    sourceLabel: 'Supabase storage size usage',
    sourceUrl: 'https://supabase.com/docs/guides/platform/manage-your-usage/storage-size',
  },
  {
    id: 'edge-functions',
    label: 'Edge Function invocations',
    quota: '500,000 / month',
    watchAt: '300,000',
    actionAt: '400,000',
    severity: 'watch',
    promiseImpact: '알림 worker는 Vercel route를 쓰므로 Supabase Edge Function 호출 한도와는 직접 관련이 낮습니다.',
    operatorAction: '추후 Supabase Edge Function을 추가할 때만 이 항목을 적극적으로 봅니다.',
    sourceLabel: 'Supabase Edge Functions pricing',
    sourceUrl: 'https://supabase.com/docs/guides/functions/pricing',
  },
];

export function getPriorityFreePlanLimits() {
  return SUPABASE_FREE_PLAN_LIMITS.filter((limit) => limit.severity === 'priority');
}

function hashToken(value: string) {
  return createHash('sha256').update(value).digest();
}

export function isAdminFreePlanLimitsTokenAllowed(rawToken: string, configuredToken = process.env.ADMIN_LIMITS_PAGE_TOKEN) {
  const token = rawToken.trim();
  const expectedToken = configuredToken?.trim();

  if (!expectedToken || token.length < MIN_ADMIN_TOKEN_LENGTH || expectedToken.length < MIN_ADMIN_TOKEN_LENGTH) {
    return false;
  }

  return timingSafeEqual(hashToken(token), hashToken(expectedToken));
}
