import { Link2 } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--app-background)] px-4 py-8">
      <section className="app-card-shadow w-full max-w-[430px] rounded-[20px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] p-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-lime-soft)]">
          <Link2 aria-hidden="true" className="h-6 w-6 text-[var(--app-primary-deep)]" />
        </div>
        <p className="text-sm font-black text-[var(--app-primary-deep)]">언제볼래</p>
        <h1 className="mt-1 text-[28px] font-black leading-tight text-[var(--app-ink)]">공유받은 링크로 접속해 주세요</h1>
        <p className="mt-3 text-sm font-extrabold leading-5 text-[var(--app-ink-muted)]">
          약속 카드는 앱에서 만든 공유 링크를 통해 바로 열 수 있어요.
        </p>
      </section>
    </main>
  );
}
