import { describe, expect, it } from 'vitest';

import { buildPublicResponseResult } from '@/lib/publicResponseRoute';
import { ALREADY_RESPONDED_MESSAGE } from '@/lib/publicResponses';
import type { PublicResponseGateway } from '@/lib/publicResponses';

const gateway: PublicResponseGateway = {
  async getCardByToken() {
    return {
      id: 'card-1',
      mode: 'DIRECT',
      status: 'PENDING',
      ownerId: 'owner-1',
      title: '6월 19일에 성수 카페에서 볼래?',
      location: '성수 카페',
      candidates: [
        {
          id: 'candidate-a',
          sortOrder: 0,
          startsAt: '2026-06-19T10:00:00.000Z',
          endsAt: '2026-06-19T11:00:00.000Z',
        },
      ],
    };
  },
  async findRespondentByTokenHash() {
    return null;
  },
  async createRespondent() {
    return { id: 'respondent-1' };
  },
  async updateRespondent() {},
  async upsertCandidateResponses() {},
  async confirmDirectAcceptedCard() {
    return true;
  },
  async declineDirectCard() {
    return true;
  },
};

describe('buildPublicResponseResult', () => {
  it('returns a success payload and edit token for valid submissions', async () => {
    const result = await buildPublicResponseResult({
      gateway,
      token: 'public-token',
      input: {
        displayName: '민지',
        responses: [{ candidateId: 'candidate-a', choice: 'YES' }],
      },
      createEditToken: () => 'edit-token',
    });

    expect(result).toEqual({
      status: 200,
      body: {
        ok: true,
        respondentId: 'respondent-1',
        updatedExistingResponse: false,
        cardConfirmed: true,
        cardDeclined: false,
      },
      editToken: 'edit-token',
    });
  });

  it('maps missing public cards to 404 responses', async () => {
    const result = await buildPublicResponseResult({
      gateway: {
        ...gateway,
        async getCardByToken() {
          return null;
        },
      },
      token: 'missing-token',
      input: {
        displayName: '민지',
        responses: [{ candidateId: 'candidate-a', choice: 'YES' }],
      },
      createEditToken: () => 'edit-token',
    });

    expect(result).toEqual({
      status: 404,
      body: {
        ok: false,
        message: '카드를 찾을 수 없어요.',
      },
    });
  });

  it('maps repeat submissions from the same browser to 409 responses', async () => {
    const result = await buildPublicResponseResult({
      gateway: {
        ...gateway,
        async findRespondentByTokenHash() {
          return { id: 'respondent-existing' };
        },
      },
      token: 'public-token',
      editToken: 'existing-edit-token',
      input: {
        displayName: '민지',
        responses: [{ candidateId: 'candidate-a', choice: 'YES' }],
      },
      createEditToken: () => 'edit-token',
    });

    expect(result).toEqual({
      status: 409,
      body: {
        ok: false,
        message: ALREADY_RESPONDED_MESSAGE,
      },
    });
  });

  it('hides unexpected internal errors behind a generic 500 response', async () => {
    const result = await buildPublicResponseResult({
      gateway: {
        ...gateway,
        async getCardByToken() {
          throw new Error('database connection string leaked');
        },
      },
      token: 'public-token',
      input: {
        displayName: '민지',
        responses: [{ candidateId: 'candidate-a', choice: 'YES' }],
      },
      createEditToken: () => 'edit-token',
    });

    expect(result).toEqual({
      status: 500,
      body: {
        ok: false,
        message: '응답을 저장하지 못했어요.',
      },
    });
  });
});
