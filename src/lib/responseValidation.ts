import { createHash } from 'node:crypto';

export const CARD_CLOSED_MESSAGE = '이미 마감된 카드예요.';
const EMPTY_VOTE_MESSAGE = '가능한 시간을 하나 이상 선택해 주세요.';
const INVALID_CANDIDATE_MESSAGE = '응답할 수 없는 후보 시간이 포함되어 있어요.';
const VALID_CHOICES = new Set<ResponseChoice>(['YES', 'MAYBE', 'NO', 'UNANSWERED']);

export type AppointmentStatus = 'DRAFT' | 'PENDING' | 'VOTING' | 'CONFIRMED' | 'DECLINED';
export type ResponseChoice = 'YES' | 'MAYBE' | 'NO' | 'UNANSWERED';

export interface ResponseInput {
  displayName?: unknown;
  comment?: unknown;
  responses?: unknown;
}

export interface CleanResponse {
  displayName: string;
  comment: string;
  responses: Array<{
    candidateId: string;
    choice: ResponseChoice;
  }>;
}

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function readChoice(value: unknown): ResponseChoice | null {
  return typeof value === 'string' && VALID_CHOICES.has(value as ResponseChoice) ? (value as ResponseChoice) : null;
}

export function validateResponseInput(input: ResponseInput, candidateIds: string[]): CleanResponse {
  const displayName = readText(input.displayName).slice(0, 60);
  const comment = readText(input.comment).slice(0, 300);
  const allowedCandidateIds = new Set(candidateIds);

  if (!displayName) {
    throw new Error('닉네임을 입력해 주세요.');
  }

  const responseRows = Array.isArray(input.responses) ? input.responses : [];
  const responses = responseRows.map((row) => {
    const record = typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {};
    const candidateId = readText(record.candidateId);
    const choice = readChoice(record.choice);

    if (!candidateId || !choice) {
      throw new Error(EMPTY_VOTE_MESSAGE);
    }

    if (!allowedCandidateIds.has(candidateId)) {
      throw new Error(INVALID_CANDIDATE_MESSAGE);
    }

    return { candidateId, choice };
  });

  if (!responses.some((response) => response.choice !== 'UNANSWERED')) {
    throw new Error(EMPTY_VOTE_MESSAGE);
  }

  return {
    displayName,
    comment,
    responses,
  };
}

export function validateCardCanReceiveResponses(card: { status: AppointmentStatus; candidateCount: number; expiresAt?: string }) {
  if (card.candidateCount === 0) {
    throw new Error('응답할 후보 시간이 없는 카드예요.');
  }

  const expiresAt = card.expiresAt ? new Date(card.expiresAt).getTime() : null;

  if (expiresAt !== null && !Number.isNaN(expiresAt) && expiresAt <= Date.now()) {
    throw new Error(CARD_CLOSED_MESSAGE);
  }

  if (card.status !== 'PENDING' && card.status !== 'VOTING') {
    throw new Error(CARD_CLOSED_MESSAGE);
  }
}

export function hashResponseToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
