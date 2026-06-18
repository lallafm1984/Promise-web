'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, Clock3, MapPin, MessageCircle, Pencil, Send, Sparkles, X } from 'lucide-react';

import type { PublicCardView } from '@/lib/publicCardView';
import type { ResponseChoice } from '@/lib/responseValidation';

type SelectableChoice = Exclude<ResponseChoice, 'UNANSWERED'>;

const choiceOptions: Array<{
  choice: SelectableChoice;
  label: string;
  description: string;
  icon: typeof Check;
  className: string;
  selectedClassName: string;
}> = [
  {
    choice: 'YES',
    label: '가능',
    description: '갈 수 있어요',
    icon: Check,
    className: 'bg-[var(--app-mint-soft)] text-[var(--app-ink)]',
    selectedClassName: 'bg-[var(--app-mint)] text-[var(--app-ink)] shadow-[inset_0_0_0_2px_var(--app-ink)]',
  },
  {
    choice: 'MAYBE',
    label: '애매',
    description: '조정이 필요해요',
    icon: Sparkles,
    className: 'bg-[var(--app-amber-soft)] text-[var(--app-ink)]',
    selectedClassName: 'bg-[var(--app-amber)] text-[var(--app-ink)] shadow-[inset_0_0_0_2px_var(--app-ink)]',
  },
  {
    choice: 'NO',
    label: '어려움',
    description: '이번엔 힘들어요',
    icon: X,
    className: 'bg-[var(--app-coral-soft)] text-[var(--app-ink)]',
    selectedClassName: 'bg-[var(--app-coral)] text-[var(--app-ink)] shadow-[inset_0_0_0_2px_var(--app-ink)]',
  },
];

function getModeLabel(mode: PublicCardView['mode']) {
  return mode === 'DIRECT' ? '이때 볼래?' : '언제 볼까?';
}

function getStatusLabel(card: PublicCardView) {
  if (card.status === 'PENDING') {
    return '응답 대기';
  }

  if (card.status === 'VOTING') {
    return '투표 진행 중';
  }

  if (card.status === 'CONFIRMED') {
    return '확정됨';
  }

  if (card.status === 'DECLINED') {
    return '마감됨';
  }

  return '준비 중';
}

function canRespond(card: PublicCardView) {
  return (card.status === 'PENDING' || card.status === 'VOTING') && card.candidates.length > 0;
}

function ChoiceButton({
  option,
  selected,
  onSelect,
}: {
  option: (typeof choiceOptions)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        'flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-[14px] border-2 border-[var(--app-line)] px-2 text-[13px] font-black leading-none tracking-normal transition active:scale-[0.99]',
        selected ? option.selectedClassName : option.className,
      ].join(' ')}>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--app-primary-deep)]" />
      <span>{option.label}</span>
    </button>
  );
}

export function ResponseForm({ card }: { card: PublicCardView }) {
  const [displayName, setDisplayName] = useState('');
  const [comment, setComment] = useState('');
  const [directChoice, setDirectChoice] = useState<SelectableChoice | null>(null);
  const [pollChoices, setPollChoices] = useState<Record<string, SelectableChoice>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cardConfirmed, setCardConfirmed] = useState(false);

  const selectedCount = useMemo(
    () => (card.mode === 'DIRECT' ? (directChoice ? 1 : 0) : Object.keys(pollChoices).length),
    [card.mode, directChoice, pollChoices],
  );
  const isClosed = !canRespond(card);

  async function submitResponse() {
    setError(null);

    if (!displayName.trim()) {
      setError('닉네임을 입력해 주세요.');
      return;
    }

    if (selectedCount === 0) {
      setError(card.mode === 'DIRECT' ? '가능한지 하나를 선택해 주세요.' : '가능한 시간을 하나 이상 선택해 주세요.');
      return;
    }

    const responses =
      card.mode === 'DIRECT'
        ? [{ candidateId: card.candidates[0]?.id, choice: directChoice }]
        : Object.entries(pollChoices).map(([candidateId, choice]) => ({ candidateId, choice }));

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/cards/${card.publicToken}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName,
          comment,
          responses,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string; cardConfirmed?: boolean };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? '응답을 저장하지 못했어요.');
      }

      setCardConfirmed(Boolean(payload.cardConfirmed));
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '응답을 저장하지 못했어요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="app-card-shadow rounded-[20px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] p-5">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--app-line)] bg-[var(--app-mint)] text-white">
          <Check aria-hidden="true" className="h-7 w-7" />
        </div>
        <p className="text-sm font-black text-[var(--app-primary-deep)]">{cardConfirmed ? '약속 확정' : '응답 완료'}</p>
        <h2 className="mt-1 text-[26px] font-black leading-tight text-[var(--app-ink)]">
          {cardConfirmed ? '약속이 확정됐어요' : '카드에 답장을 남겼어요'}
        </h2>
        <p className="mt-3 text-sm font-extrabold leading-5 text-[var(--app-ink-muted)]">
          {cardConfirmed
            ? '카드 생성자의 앱 일정에 바로 등록됐어요.'
            : '같은 브라우저에서 다시 열면 응답을 수정할 수 있어요.'}
        </p>
        <div className="mt-5 grid gap-2">
          {!cardConfirmed ? (
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-4 text-sm font-black text-[var(--app-ink)]">
              <Pencil aria-hidden="true" className="h-4 w-4 text-[var(--app-primary-deep)]" />
              응답 수정하기
            </button>
          ) : null}
          <a
            href={process.env.NEXT_PUBLIC_APP_CTA_URL ?? 'https://whenbollae.app'}
            className="flex min-h-12 items-center justify-center rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-primary)] px-4 text-sm font-black text-white">
            나도 카드 만들기
          </a>
        </div>
      </section>
    );
  }

  return (
    <form
      className="app-card-shadow rounded-[20px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submitResponse();
      }}>
      <div className="mb-4 rounded-[18px] border-2 border-[var(--app-line)] bg-[var(--app-coral-soft)] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="rounded-full border-2 border-[var(--app-line)] bg-[var(--app-lime-soft)] px-3 py-1 text-xs font-black text-[var(--app-primary-deep)]">
            {getModeLabel(card.mode)}
          </span>
          <span className="rounded-full border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-1 text-xs font-black text-[var(--app-ink-muted)]">
            {getStatusLabel(card)}
          </span>
        </div>
        <h1 className="text-[25px] font-black leading-[1.18] text-[var(--app-ink)]">{card.title}</h1>
        <div className="mt-3 grid gap-2">
          <div className="flex min-h-10 items-center gap-2 rounded-[10px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-3 text-sm font-extrabold text-[var(--app-ink)]">
            <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--app-primary-deep)]" />
            <span className="min-w-0 flex-1">{card.candidates.map((candidate) => candidate.shortLabel).join(' / ')}</span>
          </div>
          <div className="flex min-h-10 items-center gap-2 rounded-[10px] border-2 border-[var(--app-line)] bg-[var(--app-surface)] px-3 text-sm font-extrabold text-[var(--app-ink)]">
            <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--app-primary-deep)]" />
            <span className="min-w-0 flex-1">{card.location}</span>
          </div>
        </div>
        {card.message ? (
          <div className="mt-3 flex items-start gap-2 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-paper)] p-3 text-sm font-extrabold leading-5 text-[var(--app-ink)]">
            <MessageCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-primary-deep)]" />
            <p>{card.message}</p>
          </div>
        ) : null}
      </div>

      {isClosed ? (
        <div className="rounded-[16px] border-2 border-[var(--app-line)] bg-[var(--app-amber-soft)] p-4">
          <p className="text-base font-black text-[var(--app-ink)]">지금은 응답할 수 없는 카드예요.</p>
          <p className="mt-1 text-sm font-extrabold leading-5 text-[var(--app-ink-muted)]">
            약속이 이미 확정됐거나 카드가 마감됐어요.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-black text-[var(--app-ink-muted)]">닉네임</span>
              <input
                value={displayName}
                maxLength={60}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="이름이나 별명을 알려주세요"
                className="min-h-12 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-paper)] px-3 text-base font-black text-[var(--app-ink)] outline-none focus:ring-2 focus:ring-[var(--app-primary)]"
              />
            </label>

            {card.mode === 'DIRECT' ? (
              <fieldset className="grid gap-2">
                <legend className="text-xs font-black text-[var(--app-ink-muted)]">응답 선택</legend>
                <div className="grid grid-cols-3 gap-2">
                  {choiceOptions.map((option) => (
                    <ChoiceButton
                      key={option.choice}
                      option={option}
                      selected={directChoice === option.choice}
                      onSelect={() => setDirectChoice(option.choice)}
                    />
                  ))}
                </div>
              </fieldset>
            ) : (
              <fieldset className="grid gap-2">
                <legend className="text-xs font-black text-[var(--app-ink-muted)]">가능한 시간 투표</legend>
                <div className="grid gap-2">
                  {card.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="rounded-[16px] border-2 border-[var(--app-line)] bg-[var(--app-paper)] p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-black text-[var(--app-ink)]">
                        <Clock3 aria-hidden="true" className="h-4 w-4 text-[var(--app-primary-deep)]" />
                        <span>{candidate.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {choiceOptions.map((option) => (
                          <ChoiceButton
                            key={option.choice}
                            option={option}
                            selected={pollChoices[candidate.id] === option.choice}
                            onSelect={() =>
                              setPollChoices((current) => ({
                                ...current,
                                [candidate.id]: option.choice,
                              }))
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
            )}

            <label className="grid gap-1.5">
              <span className="text-xs font-black text-[var(--app-ink-muted)]">한마디</span>
              <textarea
                value={comment}
                maxLength={300}
                onChange={(event) => setComment(event.target.value)}
                placeholder="기다린다, 조금 늦어도 괜찮아 같은 말을 남겨보세요"
                className="min-h-24 resize-none rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-paper)] px-3 py-3 text-sm font-extrabold leading-5 text-[var(--app-ink)] outline-none focus:ring-2 focus:ring-[var(--app-primary)]"
              />
            </label>
          </div>

          {error ? (
            <div role="alert" className="mt-4 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-lime-soft)] p-3 text-sm font-black text-[var(--app-ink)]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border-2 border-[var(--app-line)] bg-[var(--app-coral-soft)] px-4 text-base font-black tracking-normal text-[var(--app-ink)] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)] transition disabled:opacity-60 active:scale-[0.99]">
            <Send aria-hidden="true" className="h-4 w-4 text-[var(--app-primary-deep)]" />
            {isSubmitting ? '저장 중' : '응답 완료하기'}
          </button>
        </>
      )}
    </form>
  );
}
