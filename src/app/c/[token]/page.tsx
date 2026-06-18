import { Link2 } from 'lucide-react';

import { ResponseForm } from '@/components/ResponseForm';
import { getPublicCardViewByToken } from '@/lib/publicCardView';

export const dynamic = 'force-dynamic';

function InvalidCard() {
  return (
    <section className="app-card-shadow w-full rounded-[20px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] p-5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-amber-soft)]">
        <Link2 aria-hidden="true" className="h-6 w-6 text-[var(--app-primary-deep)]" />
      </div>
      <p className="text-sm font-black text-[var(--app-primary-deep)]">링크 확인</p>
      <h1 className="mt-1 text-[27px] font-black leading-tight text-[var(--app-ink)]">카드를 찾을 수 없어요</h1>
      <p className="mt-3 text-sm font-extrabold leading-5 text-[var(--app-ink-muted)]">
        링크가 잘렸거나 이미 삭제된 카드일 수 있어요. 공유해 준 친구에게 다시 확인해 주세요.
      </p>
    </section>
  );
}

export default async function CardResponsePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await getPublicCardViewByToken(decodeURIComponent(token));

  return (
    <main className="min-h-dvh bg-[var(--app-background)] px-4 py-4 sm:py-8">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4">
        {card ? <ResponseForm card={card} /> : <InvalidCard />}
      </div>
    </main>
  );
}
