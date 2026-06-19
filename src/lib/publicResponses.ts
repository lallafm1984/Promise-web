import {
  hashResponseToken,
  validateCardCanReceiveResponses,
  validateResponseInput,
  type AppointmentStatus,
  type ResponseChoice,
  type ResponseInput,
} from '@/lib/responseValidation';

export const ALREADY_RESPONDED_MESSAGE = '이미 응답 완료된 카드예요.';

export interface PublicCardForResponse {
  id: string;
  mode: 'DIRECT' | 'POLL';
  status: AppointmentStatus;
  ownerId: string;
  title: string;
  location: string;
  candidates: Array<{
    id: string;
    sortOrder: number;
    startsAt: string;
    endsAt: string;
  }>;
}

export interface PublicResponseGateway {
  getCardByToken(token: string): Promise<PublicCardForResponse | null>;
  findRespondentByTokenHash(cardId: string, responseTokenHash: string): Promise<{ id: string } | null>;
  createRespondent(row: {
    cardId: string;
    displayName: string;
    comment: string;
    responseTokenHash: string;
  }): Promise<{ id: string }>;
  updateRespondent(row: { respondentId: string; displayName: string; comment: string }): Promise<void>;
  upsertCandidateResponses(
    rows: Array<{
      respondentId: string;
      candidateId: string;
      choice: ResponseChoice;
    }>,
  ): Promise<void>;
}

export interface SubmitPublicResponseInput {
  gateway: PublicResponseGateway;
  token: string;
  input: ResponseInput;
  editToken?: string;
  createEditToken: () => string;
}

export async function hasSubmittedPublicResponseForCard({
  gateway,
  cardId,
  editToken,
}: {
  gateway: PublicResponseGateway;
  cardId: string;
  editToken?: string;
}) {
  if (!editToken) {
    return false;
  }

  return Boolean(await gateway.findRespondentByTokenHash(cardId, hashResponseToken(editToken)));
}

export async function submitPublicResponse({
  gateway,
  token,
  input,
  editToken,
  createEditToken,
}: SubmitPublicResponseInput) {
  const card = await gateway.getCardByToken(token.trim());

  if (!card) {
    throw new Error('카드를 찾을 수 없어요.');
  }

  const candidates = [...card.candidates].sort((left, right) => left.sortOrder - right.sortOrder);
  const existingTokenHash = editToken ? hashResponseToken(editToken) : null;
  const existingRespondent = existingTokenHash
    ? await gateway.findRespondentByTokenHash(card.id, existingTokenHash)
    : null;

  if (existingRespondent) {
    throw new Error(ALREADY_RESPONDED_MESSAGE);
  }

  validateCardCanReceiveResponses({ status: card.status, candidateCount: candidates.length });

  const cleanInput = validateResponseInput(
    input,
    candidates.map((candidate) => candidate.id),
  );

  const responseToken = createEditToken();
  const responseTokenHash = hashResponseToken(responseToken);
  const respondent = await gateway.createRespondent({
    cardId: card.id,
    displayName: cleanInput.displayName,
    comment: cleanInput.comment,
    responseTokenHash,
  });

  const choicesByCandidateId = new Map(cleanInput.responses.map((response) => [response.candidateId, response.choice]));
  await gateway.upsertCandidateResponses(
    candidates.map((candidate) => ({
      respondentId: respondent.id,
      candidateId: candidate.id,
      choice: choicesByCandidateId.get(candidate.id) ?? 'UNANSWERED',
    })),
  );

  return {
    editToken: responseToken,
    respondentId: respondent.id,
    updatedExistingResponse: false,
    cardConfirmed: false,
    cardDeclined: false,
  };
}
