import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Cloud,
  Database,
  Gauge,
  HardDrive,
  Radio,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';

import {
  ADMIN_FREE_PLAN_LIMITS_TOKEN_ENV,
  getPriorityFreePlanLimits,
  isAdminFreePlanLimitsTokenAllowed,
  SUPABASE_FREE_PLAN_LIMITS,
  SUPABASE_FREE_PLAN_SOURCE_CHECKED_AT,
  type SupabaseFreePlanLimit,
} from '@/lib/adminFreePlanLimits';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Promise 무료 플랜 한도 알림',
  robots: {
    index: false,
    follow: false,
  },
};

const limitIcons = {
  'database-size': Database,
  egress: Cloud,
  'realtime-peak-connections': Radio,
  'realtime-messages': BellRing,
  'monthly-active-users': Users,
  'storage-size': HardDrive,
  'edge-functions': Zap,
} as const;

function LimitIcon({ limit }: { limit: SupabaseFreePlanLimit }) {
  const Icon = limitIcons[limit.id as keyof typeof limitIcons] ?? Gauge;
  return <Icon aria-hidden="true" className="h-5 w-5" />;
}

function LimitCard({ limit }: { limit: SupabaseFreePlanLimit }) {
  const isPriority = limit.severity === 'priority';

  return (
    <article className="rounded-lg border-2 border-[var(--app-line)] bg-[var(--app-surface)] p-4 app-card-shadow">
      <div className="flex items-start gap-3">
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-[var(--app-line)]',
            isPriority ? 'bg-[var(--app-danger-soft)] text-[var(--app-danger)]' : 'bg-[var(--app-sky-soft)] text-[var(--app-primary-deep)]',
          ].join(' ')}
        >
          <LimitIcon limit={limit} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black leading-6 text-[var(--app-ink)]">{limit.label}</h2>
            <span
              className={[
                'rounded-full border px-2 py-0.5 text-[11px] font-black',
                isPriority
                  ? 'border-[var(--app-danger)] bg-[var(--app-danger-soft)] text-[var(--app-danger)]'
                  : 'border-[var(--app-line)] bg-[var(--app-paper)] text-[var(--app-ink-muted)]',
              ].join(' ')}
            >
              {isPriority ? '우선 경고' : '월간 점검'}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-black text-[var(--app-ink-muted)]">무료 한도</dt>
              <dd className="mt-0.5 font-black text-[var(--app-ink)]">{limit.quota}</dd>
            </div>
            <div>
              <dt className="font-black text-[var(--app-ink-muted)]">주의선</dt>
              <dd className="mt-0.5 font-black text-[var(--app-coral)]">{limit.watchAt}</dd>
            </div>
            <div>
              <dt className="font-black text-[var(--app-ink-muted)]">조치선</dt>
              <dd className="mt-0.5 font-black text-[var(--app-danger)]">{limit.actionAt}</dd>
            </div>
          </dl>

          <p className="mt-3 text-sm font-bold leading-5 text-[var(--app-ink-muted)]">{limit.promiseImpact}</p>
          <p className="mt-2 text-sm font-extrabold leading-5 text-[var(--app-ink)]">{limit.operatorAction}</p>

          <a
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-[var(--app-primary-deep)] underline decoration-2 underline-offset-4"
            href={limit.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            {limit.sourceLabel}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default async function FreePlanLimitsAdminPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!isAdminFreePlanLimitsTokenAllowed(token)) {
    notFound();
  }

  const priorityLimits = getPriorityFreePlanLimits();

  return (
    <main className="min-h-dvh bg-[var(--app-background)] px-4 py-5 text-[var(--app-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="rounded-lg border-2 border-[var(--app-line)] bg-[var(--app-paper)] p-4 app-card-shadow sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--app-line)] bg-[var(--app-lime-soft)] px-3 py-1 text-xs font-black text-[var(--app-primary-deep)]">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                관리자 전용
              </div>
              <h1 className="mt-3 text-2xl font-black leading-tight text-[var(--app-ink)] sm:text-3xl">
                Supabase 무료 플랜 한도 알림
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-[var(--app-ink-muted)]">
                Promise 운영 중 무료 플랜에서 먼저 막힐 가능성이 높은 항목과 업그레이드 판단선을 한 화면에서 확인합니다.
              </p>
            </div>

            <div className="rounded-md border-2 border-[var(--app-line)] bg-[var(--app-surface)] p-3 text-sm">
              <p className="font-black text-[var(--app-ink)]">공식 한도 확인일</p>
              <p className="mt-1 font-extrabold text-[var(--app-primary-deep)]">{SUPABASE_FREE_PLAN_SOURCE_CHECKED_AT}</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="무료 플랜 우선 경고 항목">
          {priorityLimits.map((limit) => (
            <div key={limit.id} className="rounded-lg border-2 border-[var(--app-line)] bg-[var(--app-surface)] p-4">
              <div className="flex items-center gap-2 text-[var(--app-danger)]">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
                <h2 className="text-sm font-black text-[var(--app-ink)]">{limit.label}</h2>
              </div>
              <p className="mt-2 text-sm font-bold leading-5 text-[var(--app-ink-muted)]">
                {limit.actionAt} 이상이면 즉시 운영 조치
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border-2 border-[var(--app-line)] bg-[var(--app-mint-soft)] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--app-primary-deep)]" />
            <div>
              <h2 className="text-base font-black text-[var(--app-ink)]">현재 Promise 기준 판단</h2>
              <p className="mt-1 text-sm font-bold leading-6 text-[var(--app-ink-muted)]">
                무료 플랜의 1차 병목은 MAU가 아니라 DB 500 MB, egress 5 GB, Realtime 동시 연결 200입니다. 알림 worker는 Vercel
                내부 API로 분리되어 Supabase Edge Function 한도에는 거의 영향을 주지 않습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4" aria-label="Supabase 무료 플랜 한도 목록">
          {SUPABASE_FREE_PLAN_LIMITS.map((limit) => (
            <LimitCard key={limit.id} limit={limit} />
          ))}
        </section>

        <footer className="pb-2 text-xs font-bold leading-5 text-[var(--app-ink-muted)]">
          이 페이지는 검색 노출을 막고 URL 토큰이 맞을 때만 렌더링됩니다. Vercel 환경변수 {ADMIN_FREE_PLAN_LIMITS_TOKEN_ENV} 값과
          URL 마지막 경로가 일치해야 합니다.
        </footer>
      </div>
    </main>
  );
}
