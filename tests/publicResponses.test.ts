import { describe, expect, it } from 'vitest';

import {
  ALREADY_RESPONDED_MESSAGE,
  hasSubmittedPublicResponseForCard,
  submitPublicResponse,
  type PublicResponseGateway,
} from '@/lib/publicResponses';
import { hashResponseToken } from '@/lib/responseValidation';

function createGateway(overrides: Partial<PublicResponseGateway> = {}) {
  const calls: string[] = [];
  const gateway: PublicResponseGateway = {
    async getCardByToken() {
      calls.push('getCardByToken');
      return {
        id: 'card-1',
        mode: 'POLL',
        status: 'VOTING',
        ownerId: 'owner-1',
        title: '성수 카페에서 언제 볼까?',
        location: '성수 카페',
        candidates: [
          {
            id: 'candidate-a',
            sortOrder: 0,
            startsAt: '2026-06-19T10:00:00.000Z',
            endsAt: '2026-06-19T11:00:00.000Z',
          },
          {
            id: 'candidate-b',
            sortOrder: 1,
            startsAt: '2026-06-20T10:00:00.000Z',
            endsAt: '2026-06-20T11:00:00.000Z',
          },
        ],
      };
    },
    async findRespondentByTokenHash() {
      calls.push('findRespondentByTokenHash');
      return null;
    },
    async createRespondent() {
      calls.push('createRespondent');
      return { id: 'respondent-new' };
    },
    async updateRespondent() {
      calls.push('updateRespondent');
    },
    async upsertCandidateResponses() {
      calls.push('upsertCandidateResponses');
    },
    ...overrides,
  };

  return { gateway, calls };
}

describe('submitPublicResponse', () => {
  it('creates an anonymous respondent and fills omitted poll candidates as unanswered', async () => {
    const upserts: unknown[] = [];
    const { gateway, calls } = createGateway({
      async upsertCandidateResponses(rows) {
        upserts.push(rows);
      },
    });

    const result = await submitPublicResponse({
      gateway,
      token: 'public-token',
      input: {
        displayName: ' 민지 ',
        responses: [{ candidateId: 'candidate-a', choice: 'YES' }],
      },
      createEditToken: () => 'new-edit-token',
    });

    expect(result).toEqual({
      editToken: 'new-edit-token',
      respondentId: 'respondent-new',
      updatedExistingResponse: false,
      cardConfirmed: false,
      cardDeclined: false,
    });
    expect(calls).toEqual(['getCardByToken', 'createRespondent']);
    expect(upserts).toEqual([
      [
        { respondentId: 'respondent-new', candidateId: 'candidate-a', choice: 'YES' },
        { respondentId: 'respondent-new', candidateId: 'candidate-b', choice: 'UNANSWERED' },
      ],
    ]);
  });

  it('rejects repeat submissions when the edit token cookie already has a response', async () => {
    const tokenHash = hashResponseToken('existing-edit-token');
    const updated: unknown[] = [];
    const { gateway, calls } = createGateway({
      async findRespondentByTokenHash(cardId, responseTokenHash) {
        expect(cardId).toBe('card-1');
        expect(responseTokenHash).toBe(tokenHash);
        return { id: 'respondent-existing' };
      },
      async updateRespondent(row) {
        updated.push(row);
      },
    });

    await expect(
      submitPublicResponse({
        gateway,
        token: 'public-token',
        editToken: 'existing-edit-token',
        input: {
          displayName: ' 지훈 ',
          comment: '조금 늦을 수 있어요',
          responses: [{ candidateId: 'candidate-b', choice: 'YES' }],
        },
        createEditToken: () => 'new-token-should-not-be-used',
      }),
    ).rejects.toThrow(ALREADY_RESPONDED_MESSAGE);

    expect(calls).toEqual(['getCardByToken']);
    expect(updated).toEqual([]);
  });

  it('detects when the current browser already submitted a response for a card', async () => {
    const tokenHash = hashResponseToken('existing-edit-token');
    const { gateway } = createGateway({
      async findRespondentByTokenHash(cardId, responseTokenHash) {
        expect(cardId).toBe('card-1');
        expect(responseTokenHash).toBe(tokenHash);
        return { id: 'respondent-existing' };
      },
    });

    await expect(
      hasSubmittedPublicResponseForCard({
        gateway,
        cardId: 'card-1',
        editToken: 'existing-edit-token',
      }),
    ).resolves.toBe(true);
  });

  it('does not treat browsers without an edit token as already submitted', async () => {
    const { gateway, calls } = createGateway();

    await expect(
      hasSubmittedPublicResponseForCard({
        gateway,
        cardId: 'card-1',
      }),
    ).resolves.toBe(false);
    expect(calls).toEqual([]);
  });

  it('stores a direct accepted response without auto-confirming the card', async () => {
    const { gateway } = createGateway({
      async getCardByToken() {
        return {
          id: 'card-direct',
          mode: 'DIRECT',
          status: 'PENDING',
          ownerId: 'owner-1',
          title: '6월 19일에 성수 카페에서 볼래?',
          location: '성수 카페',
          candidates: [
            {
              id: 'candidate-direct',
              sortOrder: 0,
              startsAt: '2026-06-19T10:00:00.000Z',
              endsAt: '2026-06-19T11:00:00.000Z',
            },
          ],
        };
      },
    });

    const result = await submitPublicResponse({
      gateway,
      token: 'direct-token',
      input: {
        displayName: '민지',
        responses: [{ candidateId: 'candidate-direct', choice: 'YES' }],
      },
      createEditToken: () => 'edit-token',
    });

    expect(result.cardConfirmed).toBe(false);
    expect(result.cardDeclined).toBe(false);
  });

  it('does not schedule a direct card when the response is maybe or no', async () => {
    const { gateway } = createGateway({
      async getCardByToken() {
        return {
          id: 'card-direct',
          mode: 'DIRECT',
          status: 'PENDING',
          ownerId: 'owner-1',
          title: '6월 19일에 성수 카페에서 볼래?',
          location: '성수 카페',
          candidates: [
            {
              id: 'candidate-direct',
              sortOrder: 0,
              startsAt: '2026-06-19T10:00:00.000Z',
              endsAt: '2026-06-19T11:00:00.000Z',
            },
          ],
        };
      },
    });

    const result = await submitPublicResponse({
      gateway,
      token: 'direct-token',
      input: {
        displayName: '민지',
        responses: [{ candidateId: 'candidate-direct', choice: 'MAYBE' }],
      },
      createEditToken: () => 'edit-token',
    });

    expect(result.cardConfirmed).toBe(false);
  });

  it('stores a direct declined response without auto-declining the card', async () => {
    const { gateway } = createGateway({
      async getCardByToken() {
        return {
          id: 'card-direct',
          mode: 'DIRECT',
          status: 'PENDING',
          ownerId: 'owner-1',
          title: '6월 19일에 성수 카페에서 볼래?',
          location: '성수 카페',
          candidates: [
            {
              id: 'candidate-direct',
              sortOrder: 0,
              startsAt: '2026-06-19T10:00:00.000Z',
              endsAt: '2026-06-19T11:00:00.000Z',
            },
          ],
        };
      },
    });

    const result = await submitPublicResponse({
      gateway,
      token: 'direct-token',
      input: {
        displayName: '민지',
        responses: [{ candidateId: 'candidate-direct', choice: 'NO' }],
      },
      createEditToken: () => 'edit-token',
    });

    expect(result.cardConfirmed).toBe(false);
    expect(result.cardDeclined).toBe(false);
  });

  it('does not auto-confirm poll cards even when a candidate receives yes', async () => {
    const { gateway } = createGateway();

    const result = await submitPublicResponse({
      gateway,
      token: 'poll-token',
      input: {
        displayName: '민지',
        responses: [{ candidateId: 'candidate-a', choice: 'YES' }],
      },
      createEditToken: () => 'edit-token',
    });

    expect(result.cardConfirmed).toBe(false);
  });

  it('rejects unknown public tokens', async () => {
    const { gateway } = createGateway({
      async getCardByToken() {
        return null;
      },
    });

    await expect(
      submitPublicResponse({
        gateway,
        token: 'missing-token',
        input: {
          displayName: '민지',
          responses: [{ candidateId: 'candidate-a', choice: 'YES' }],
        },
        createEditToken: () => 'new-edit-token',
      }),
    ).rejects.toThrow('카드를 찾을 수 없어요.');
  });
});
