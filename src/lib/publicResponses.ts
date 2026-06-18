import {
  hashResponseToken,
  validateCardCanReceiveResponses,
  validateResponseInput,
  type AppointmentStatus,
  type ResponseChoice,
  type ResponseInput,
} from '@/lib/responseValidation';

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
  confirmDirectAcceptedCard(input: {
    cardId: string;
    ownerId: string;
    title: string;
    location: string;
    candidate: {
      id: string;
      startsAt: string;
      endsAt: string;
    };
  }): Promise<void>;
}

export interface SubmitPublicResponseInput {
  gateway: PublicResponseGateway;
  token: string;
  input: ResponseInput;
  editToken?: string;
  createEditToken: () => string;
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
  validateCardCanReceiveResponses({ status: card.status, candidateCount: candidates.length });

  const cleanInput = validateResponseInput(
    input,
    candidates.map((candidate) => candidate.id),
  );
  const existingTokenHash = editToken ? hashResponseToken(editToken) : null;
  const existingRespondent = existingTokenHash
    ? await gateway.findRespondentByTokenHash(card.id, existingTokenHash)
    : null;

  const responseToken = existingRespondent && editToken ? editToken : createEditToken();
  const responseTokenHash = hashResponseToken(responseToken);
  const respondent = existingRespondent
    ? existingRespondent
    : await gateway.createRespondent({
        cardId: card.id,
        displayName: cleanInput.displayName,
        comment: cleanInput.comment,
        responseTokenHash,
      });

  if (existingRespondent) {
    await gateway.updateRespondent({
      respondentId: existingRespondent.id,
      displayName: cleanInput.displayName,
      comment: cleanInput.comment,
    });
  }

  const choicesByCandidateId = new Map(cleanInput.responses.map((response) => [response.candidateId, response.choice]));
  await gateway.upsertCandidateResponses(
    candidates.map((candidate) => ({
      respondentId: respondent.id,
      candidateId: candidate.id,
      choice: choicesByCandidateId.get(candidate.id) ?? 'UNANSWERED',
    })),
  );

  const acceptedDirectCandidate =
    card.mode === 'DIRECT'
      ? candidates.find((candidate) => choicesByCandidateId.get(candidate.id) === 'YES')
      : undefined;

  if (acceptedDirectCandidate) {
    await gateway.confirmDirectAcceptedCard({
      cardId: card.id,
      ownerId: card.ownerId,
      title: card.title,
      location: card.location,
      candidate: {
        id: acceptedDirectCandidate.id,
        startsAt: acceptedDirectCandidate.startsAt,
        endsAt: acceptedDirectCandidate.endsAt,
      },
    });
  }

  return {
    editToken: responseToken,
    respondentId: respondent.id,
    updatedExistingResponse: Boolean(existingRespondent),
    cardConfirmed: Boolean(acceptedDirectCandidate),
  };
}
