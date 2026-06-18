import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { AppointmentStatus } from '@/lib/responseValidation';

export type AppointmentMode = 'DIRECT' | 'POLL';

export interface PublicCandidateView {
  id: string;
  startsAt: string;
  endsAt: string;
  label: string;
  shortLabel: string;
  sortOrder: number;
}

export interface PublicCardView {
  id: string;
  publicToken: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  title: string;
  hostName: string;
  location: string;
  message: string;
  createdAt: string;
  candidates: PublicCandidateView[];
}

interface AppointmentCardRow {
  id: string;
  owner_id: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  title: string;
  location: string;
  message: string;
  public_token: string;
  created_at: string;
}

interface AppointmentCandidateRow {
  id: string;
  starts_at: string;
  ends_at: string;
  label: string;
  short_label: string;
  sort_order: number;
}

interface ProfileRow {
  display_name: string;
}

function formatFallbackDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(date);
}

function formatFallbackShortDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export async function getPublicCardViewByToken(token: string): Promise<PublicCardView | null> {
  const client = getSupabaseAdmin();
  const cleanToken = token.trim();

  if (!cleanToken) {
    return null;
  }

  const { data: cardData, error: cardError } = await client
    .from('appointment_cards')
    .select('id, owner_id, mode, status, title, location, message, public_token, created_at')
    .eq('public_token', cleanToken)
    .maybeSingle();

  if (cardError) {
    throw cardError;
  }

  if (!cardData) {
    return null;
  }

  const card = cardData as AppointmentCardRow;
  const [{ data: candidateData, error: candidateError }, { data: profileData, error: profileError }] = await Promise.all([
    client
      .from('appointment_candidates')
      .select('id, starts_at, ends_at, label, short_label, sort_order')
      .eq('card_id', card.id)
      .order('sort_order', { ascending: true }),
    client.from('profiles').select('display_name').eq('id', card.owner_id).maybeSingle(),
  ]);

  if (candidateError) {
    throw candidateError;
  }

  if (profileError) {
    throw profileError;
  }

  const profile = profileData as ProfileRow | null;
  const candidates = ((candidateData ?? []) as AppointmentCandidateRow[]).map((candidate) => ({
    id: candidate.id,
    startsAt: candidate.starts_at,
    endsAt: candidate.ends_at,
    label: candidate.label || formatFallbackDateTime(candidate.starts_at),
    shortLabel: candidate.short_label || formatFallbackShortDateTime(candidate.starts_at),
    sortOrder: candidate.sort_order,
  }));

  return {
    id: card.id,
    publicToken: card.public_token,
    mode: card.mode,
    status: card.status,
    title: card.title,
    hostName: profile?.display_name ?? '친구',
    location: card.location,
    message: card.message,
    createdAt: card.created_at,
    candidates,
  };
}
