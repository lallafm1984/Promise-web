import { CheckCircle2, Link2 } from 'lucide-react';
import { cookies } from 'next/headers';

import { ResponseForm } from '@/components/ResponseForm';
import { getPublicCardViewByToken, type PublicCardView } from '@/lib/publicCardView';
import { getResponseCookieName } from '@/lib/publicResponseCookies';
import { hasSubmittedPublicResponseForCard } from '@/lib/publicResponses';
import { createSupabasePublicResponseGateway } from '@/lib/supabasePublicResponses';

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
        링크가 틀렸거나 이미 삭제된 카드일 수 있어요. 공유해 준 친구에게 다시 확인해 주세요.
      </p>
    </section>
  );
}

function AlreadyRespondedCard({ card }: { card: PublicCardView }) {
  return (
    <section className="app-card-shadow rounded-[20px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] p-5">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--app-line)] bg-[var(--app-mint)] text-white">
        <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
      </div>
      <p className="text-sm font-black text-[var(--app-primary-deep)]">응답 완료</p>
      <h1 className="mt-1 text-[26px] font-black leading-tight text-[var(--app-ink)]">이미 응답 완료되었어요</h1>
      <div className="mt-4 rounded-[16px] border-2 border-[var(--app-line)] bg-[var(--app-paper)] p-3">
        <p className="text-sm font-black leading-5 text-[var(--app-ink)]">{card.title}</p>
        <p className="mt-1 text-xs font-extrabold text-[var(--app-ink-muted)]">{card.location}</p>
      </div>
      <a
        href={process.env.NEXT_PUBLIC_APP_CTA_URL ?? 'https://whenbollae.app'}
        className="mt-5 flex min-h-12 items-center justify-center rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-primary)] px-4 text-sm font-black text-white">
        나도 카드 만들기
      </a>
    </section>
  );
}

export default async function CardResponsePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cleanToken = decodeURIComponent(token);
  const card = await getPublicCardViewByToken(cleanToken);
  let hasSubmitted = false;

  if (card) {
    const cookieStore = await cookies();
    hasSubmitted = await hasSubmittedPublicResponseForCard({
      gateway: createSupabasePublicResponseGateway(),
      cardId: card.id,
      editToken: cookieStore.get(getResponseCookieName(cleanToken))?.value,
    });
  }

  return (
    <main className="flex min-h-dvh items-start justify-center bg-[var(--app-background)] px-5 py-5 md:items-center md:py-10">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4">
        {card ? hasSubmitted ? <AlreadyRespondedCard card={card} /> : <ResponseForm card={card} /> : <InvalidCard />}
      </div>
    </main>
  );
}
