import { describe, expect, it } from 'vitest';

import {
  CARD_CLOSED_MESSAGE,
  hashResponseToken,
  validateCardCanReceiveResponses,
  validateResponseInput,
} from '@/lib/responseValidation';

const candidateIds = ['candidate-a', 'candidate-b'];

describe('validateResponseInput', () => {
  it('cleans nickname, comment, and candidate choices for poll submissions', () => {
    expect(
      validateResponseInput(
        {
          displayName: '  민지  ',
          comment: '  7시는 조금 늦어도 가능해요  ',
          responses: [
            { candidateId: 'candidate-a', choice: 'YES' },
            { candidateId: 'candidate-b', choice: 'MAYBE' },
          ],
        },
        candidateIds,
      ),
    ).toEqual({
      displayName: '민지',
      comment: '7시는 조금 늦어도 가능해요',
      responses: [
        { candidateId: 'candidate-a', choice: 'YES' },
        { candidateId: 'candidate-b', choice: 'MAYBE' },
      ],
    });
  });

  it('rejects an empty nickname', () => {
    expect(() =>
      validateResponseInput(
        {
          displayName: '   ',
          responses: [{ candidateId: 'candidate-a', choice: 'YES' }],
        },
        candidateIds,
      ),
    ).toThrow('닉네임을 입력해 주세요.');
  });

  it('rejects poll submissions without at least one real vote', () => {
    expect(() =>
      validateResponseInput(
        {
          displayName: '민지',
          responses: [{ candidateId: 'candidate-a', choice: 'UNANSWERED' }],
        },
        candidateIds,
      ),
    ).toThrow('가능한 시간을 하나 이상 선택해 주세요.');
  });

  it('rejects candidates that do not belong to the public card', () => {
    expect(() =>
      validateResponseInput(
        {
          displayName: '민지',
          responses: [{ candidateId: 'other-candidate', choice: 'YES' }],
        },
        candidateIds,
      ),
    ).toThrow('응답할 수 없는 후보 시간이 포함되어 있어요.');
  });
});

describe('validateCardCanReceiveResponses', () => {
  it('allows pending direct and voting poll cards', () => {
    expect(validateCardCanReceiveResponses({ status: 'PENDING', candidateCount: 1 })).toBeUndefined();
    expect(validateCardCanReceiveResponses({ status: 'VOTING', candidateCount: 2 })).toBeUndefined();
  });

  it('blocks closed cards and cards without candidates', () => {
    expect(() => validateCardCanReceiveResponses({ status: 'CONFIRMED', candidateCount: 1 })).toThrow(CARD_CLOSED_MESSAGE);
    expect(() => validateCardCanReceiveResponses({ status: 'VOTING', candidateCount: 0 })).toThrow(
      '응답할 후보 시간이 없는 카드예요.',
    );
  });

  it('blocks cards after the three-day response window expires', () => {
    expect(() =>
      validateCardCanReceiveResponses({
        status: 'PENDING',
        candidateCount: 1,
        expiresAt: '2026-06-19T00:00:00.000Z',
      }),
    ).toThrow(CARD_CLOSED_MESSAGE);
  });
});

describe('hashResponseToken', () => {
  it('returns a stable sha-256 hex digest without exposing the raw token', () => {
    const hash = hashResponseToken('edit-token');

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hashResponseToken('edit-token'));
    expect(hash).not.toContain('edit-token');
  });
});
