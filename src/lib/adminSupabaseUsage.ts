import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const SUPABASE_MANAGEMENT_API_TOKEN_ENV = 'SUPABASE_MANAGEMENT_API_TOKEN';
export const SUPABASE_ACCESS_TOKEN_ENV = 'SUPABASE_ACCESS_TOKEN';
export const SUPABASE_PROJECT_REF_ENV = 'SUPABASE_PROJECT_REF';

export type UsageLevel = 'ok' | 'watch' | 'action' | 'unknown';

export interface UsageThresholds {
  watch: number;
  action: number;
}

export interface UsageMetric {
  id: string;
  label: string;
  value: number | null;
  formattedValue: string;
  unit?: string;
  level: UsageLevel;
  helper: string;
}

export interface TableUsageCount {
  table: string;
  label: string;
  count: number | null;
  error?: string;
}

export interface NotificationUsageCounts {
  pending: number;
  processing: number;
  retry: number;
  delivered: number;
  failed: number;
  total: number;
  activeQueue: number;
}

export interface ManagementApiUsageCounts {
  auth: number;
  realtime: number;
  rest: number;
  storage: number;
  total: number;
}

export interface ManagementApiUsage {
  status: 'ready' | 'not_configured' | 'error';
  intervalLabel: string;
  counts: ManagementApiUsageCounts | null;
  requestCount: number | null;
  error?: string;
}

export interface SupabaseUsageSnapshot {
  generatedAt: string;
  projectRef: string | null;
  metrics: UsageMetric[];
  tableCounts: TableUsageCount[];
  tableRowsTotal: number;
  notificationEvents: NotificationUsageCounts;
  managementApi: ManagementApiUsage;
  issues: string[];
}

interface UsageApiCountRow {
  timestamp?: unknown;
  total_auth_requests?: unknown;
  total_realtime_requests?: unknown;
  total_rest_requests?: unknown;
  total_storage_requests?: unknown;
}

interface UsageApiCountResponse {
  result?: UsageApiCountRow[];
  error?: unknown;
}

interface UsageApiRequestsCountResponse {
  result?: Array<{ count?: unknown }>;
  error?: unknown;
}

const SUPABASE_MANAGEMENT_API_BASE_URL = 'https://api.supabase.com';

const PROMISE_TABLES = [
  { table: 'profiles', label: '프로필' },
  { table: 'appointment_cards', label: '약속 카드' },
  { table: 'appointment_candidates', label: '후보 시간' },
  { table: 'card_recipients', label: '카드 수신자' },
  { table: 'appointment_respondents', label: '응답자' },
  { table: 'appointment_candidate_responses', label: '후보 응답' },
  { table: 'appointments', label: '확정 일정' },
  { table: 'todos', label: '할 일' },
  { table: 'friend_requests', label: '친구 요청' },
  { table: 'friendships', label: '친구 관계' },
  { table: 'notification_tokens', label: '푸시 토큰' },
  { table: 'notification_events', label: '알림 outbox' },
  { table: 'mobile_sync_versions', label: '모바일 동기화' },
  { table: 'public_response_rate_limits', label: '공개 응답 제한' },
] as const;

const NOTIFICATION_EVENT_STATUSES = ['pending', 'processing', 'retry', 'delivered', 'failed'] as const;

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown Supabase usage error';
}

export function parseSupabaseProjectRef(supabaseUrl: string | undefined | null) {
  if (!supabaseUrl) {
    return null;
  }

  try {
    const url = new URL(supabaseUrl);
    const match = url.hostname.match(/^([a-z]{20})\.supabase\.co$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getUsageLevel(value: number | null, thresholds: UsageThresholds): UsageLevel {
  if (value === null) {
    return 'unknown';
  }

  if (value >= thresholds.action) {
    return 'action';
  }

  if (value >= thresholds.watch) {
    return 'watch';
  }

  return 'ok';
}

export function formatUsageNumber(value: number | null) {
  if (value === null) {
    return '확인 필요';
  }

  if (value >= 10_000) {
    const compact = value / 10_000;
    return `${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}만`;
  }

  return new Intl.NumberFormat('ko-KR').format(value);
}

export function sumUsageApiCounts(payload: UsageApiCountResponse): ManagementApiUsageCounts {
  return (payload.result ?? []).reduce<ManagementApiUsageCounts>(
    (total, row) => {
      const auth = toNumber(row.total_auth_requests);
      const realtime = toNumber(row.total_realtime_requests);
      const rest = toNumber(row.total_rest_requests);
      const storage = toNumber(row.total_storage_requests);

      total.auth += auth;
      total.realtime += realtime;
      total.rest += rest;
      total.storage += storage;
      total.total += auth + realtime + rest + storage;

      return total;
    },
    { auth: 0, realtime: 0, rest: 0, storage: 0, total: 0 },
  );
}

function formatManagementApiError(payload: { error?: unknown }) {
  if (!payload.error) {
    return null;
  }

  if (typeof payload.error === 'string') {
    return payload.error;
  }

  if (typeof payload.error === 'object' && payload.error && 'message' in payload.error) {
    return String((payload.error as { message: unknown }).message);
  }

  return 'Supabase Management API returned an error.';
}

async function fetchManagementJson(fetcher: typeof fetch, accessToken: string, path: string) {
  const response = await fetcher(`${SUPABASE_MANAGEMENT_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const payload = (await response.json()) as { error?: unknown };

  if (!response.ok) {
    throw new Error(formatManagementApiError(payload) ?? `Supabase Management API returned ${response.status}.`);
  }

  const payloadError = formatManagementApiError(payload);

  if (payloadError) {
    throw new Error(payloadError);
  }

  return payload;
}

async function getAuthUsersCount(client: ReturnType<typeof getSupabaseAdmin>) {
  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (error) {
    throw error;
  }

  const total = (data as { total?: unknown }).total;
  return typeof total === 'number' ? total : data.users.length;
}

async function getTableCount(client: ReturnType<typeof getSupabaseAdmin>, table: string): Promise<TableUsageCount['count']> {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getNotificationStatusCount(
  client: ReturnType<typeof getSupabaseAdmin>,
  status: (typeof NOTIFICATION_EVENT_STATUSES)[number],
) {
  const { count, error } = await client
    .from('notification_events')
    .select('*', { count: 'exact', head: true })
    .eq('status', status);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getManagementApiUsage({
  fetcher,
  projectRef,
  accessToken,
}: {
  fetcher: typeof fetch;
  projectRef: string | null;
  accessToken: string | undefined;
}): Promise<ManagementApiUsage> {
  if (!projectRef || !accessToken) {
    return {
      status: 'not_configured',
      intervalLabel: '최근 1일',
      counts: null,
      requestCount: null,
      error: !projectRef ? 'Supabase project ref를 확인할 수 없습니다.' : `${SUPABASE_MANAGEMENT_API_TOKEN_ENV} 설정이 필요합니다.`,
    };
  }

  try {
    const usageCounts = (await fetchManagementJson(
      fetcher,
      accessToken,
      `/v1/projects/${projectRef}/analytics/endpoints/usage.api-counts?interval=1day`,
    )) as UsageApiCountResponse;
    const requestCount = (await fetchManagementJson(
      fetcher,
      accessToken,
      `/v1/projects/${projectRef}/analytics/endpoints/usage.api-requests-count`,
    )) as UsageApiRequestsCountResponse;

    return {
      status: 'ready',
      intervalLabel: '최근 1일',
      counts: sumUsageApiCounts(usageCounts),
      requestCount: toNumber(requestCount.result?.[0]?.count),
    };
  } catch (error) {
    return {
      status: 'error',
      intervalLabel: '최근 1일',
      counts: null,
      requestCount: null,
      error: getErrorMessage(error),
    };
  }
}

function makeMetric({
  id,
  label,
  value,
  unit,
  thresholds,
  helper,
}: {
  id: string;
  label: string;
  value: number | null;
  unit?: string;
  thresholds: UsageThresholds;
  helper: string;
}): UsageMetric {
  return {
    id,
    label,
    value,
    formattedValue: formatUsageNumber(value),
    unit,
    level: getUsageLevel(value, thresholds),
    helper,
  };
}

export async function getSupabaseUsageSnapshot(fetcher: typeof fetch = fetch): Promise<SupabaseUsageSnapshot> {
  const client = getSupabaseAdmin();
  const generatedAt = new Date().toISOString();
  const projectRef = process.env[SUPABASE_PROJECT_REF_ENV] ?? parseSupabaseProjectRef(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  const managementApiAccessToken = process.env[SUPABASE_MANAGEMENT_API_TOKEN_ENV] ?? process.env[SUPABASE_ACCESS_TOKEN_ENV];
  const issues: string[] = [];

  let authUsers: number | null = null;

  try {
    authUsers = await getAuthUsersCount(client);
  } catch (error) {
    issues.push(`Auth user count: ${getErrorMessage(error)}`);
  }

  const tableCounts = await Promise.all(
    PROMISE_TABLES.map(async ({ table, label }) => {
      try {
        return {
          table,
          label,
          count: await getTableCount(client, table),
        };
      } catch (error) {
        return {
          table,
          label,
          count: null,
          error: getErrorMessage(error),
        };
      }
    }),
  );
  const tableRowsTotal = tableCounts.reduce((total, row) => total + (row.count ?? 0), 0);

  const notificationEntries = await Promise.all(
    NOTIFICATION_EVENT_STATUSES.map(async (status) => {
      try {
        return [status, await getNotificationStatusCount(client, status)] as const;
      } catch (error) {
        issues.push(`notification_events ${status}: ${getErrorMessage(error)}`);
        return [status, 0] as const;
      }
    }),
  );
  const notificationStatusCounts = Object.fromEntries(notificationEntries) as Record<
    (typeof NOTIFICATION_EVENT_STATUSES)[number],
    number
  >;
  const notificationEvents: NotificationUsageCounts = {
    ...notificationStatusCounts,
    total: NOTIFICATION_EVENT_STATUSES.reduce((total, status) => total + notificationStatusCounts[status], 0),
    activeQueue: notificationStatusCounts.pending + notificationStatusCounts.processing + notificationStatusCounts.retry,
  };

  const managementApi = await getManagementApiUsage({
    fetcher,
    projectRef,
    accessToken: managementApiAccessToken,
  });

  if (managementApi.status !== 'ready' && managementApi.error) {
    issues.push(`Management API: ${managementApi.error}`);
  }

  const apiRequests = managementApi.requestCount ?? managementApi.counts?.total ?? null;

  return {
    generatedAt,
    projectRef,
    metrics: [
      makeMetric({
        id: 'auth-users',
        label: '가입 사용자',
        value: authUsers,
        thresholds: { watch: 30_000, action: 40_000 },
        helper: 'MAU와 완전히 같지는 않지만 Auth 한도 위험을 빠르게 보는 지표입니다.',
      }),
      makeMetric({
        id: 'promise-db-rows',
        label: 'Promise DB 행',
        value: tableRowsTotal,
        thresholds: { watch: 50_000, action: 100_000 },
        helper: 'DB 500 MB 한도의 보조 지표입니다. 실제 청구 기준은 byte 크기입니다.',
      }),
      makeMetric({
        id: 'notification-queue',
        label: '알림 대기 큐',
        value: notificationEvents.activeQueue,
        thresholds: { watch: 50, action: 200 },
        helper: 'pending, processing, retry 상태 합계입니다. 0에 가까워야 정상입니다.',
      }),
      makeMetric({
        id: 'api-requests',
        label: 'API 요청',
        value: apiRequests,
        thresholds: { watch: 50_000, action: 100_000 },
        unit: managementApi.status === 'ready' ? managementApi.intervalLabel : undefined,
        helper: 'Management API 토큰이 설정되면 최근 1일 요청 수를 표시합니다.',
      }),
    ],
    tableCounts,
    tableRowsTotal,
    notificationEvents,
    managementApi,
    issues,
  };
}
