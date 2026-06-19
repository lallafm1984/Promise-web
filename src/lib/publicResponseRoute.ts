import { ALREADY_RESPONDED_MESSAGE, submitPublicResponse, type PublicResponseGateway } from '@/lib/publicResponses';
import type { ResponseInput } from '@/lib/responseValidation';

interface BuildPublicResponseResultInput {
  gateway: PublicResponseGateway;
  token: string;
  input: ResponseInput;
  editToken?: string;
  createEditToken: () => string;
}

export type PublicResponseResult =
  | {
      status: 200;
      body: {
        ok: true;
        respondentId: string;
        updatedExistingResponse: boolean;
        cardConfirmed: boolean;
        cardDeclined: boolean;
      };
      editToken: string;
    }
  | {
      status: 400 | 404 | 409 | 500;
      body: {
        ok: false;
        message: string;
      };
    };

const GENERIC_RESPONSE_ERROR_MESSAGE = '응답을 저장하지 못했어요.';
const MISSING_CARD_MESSAGE = '카드를 찾을 수 없어요.';
const USER_SAFE_ERROR_MESSAGES = new Set([
  MISSING_CARD_MESSAGE,
  '닉네임을 입력해 주세요.',
  '가능한 시간을 하나 이상 선택해 주세요.',
  '응답할 수 없는 후보 시간이 포함되어 있어요.',
  '이미 마감된 카드예요.',
  '응답할 후보 시간이 없는 카드예요.',
]);
USER_SAFE_ERROR_MESSAGES.add(ALREADY_RESPONDED_MESSAGE);

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : GENERIC_RESPONSE_ERROR_MESSAGE;
}

export async function buildPublicResponseResult({
  gateway,
  token,
  input,
  editToken,
  createEditToken,
}: BuildPublicResponseResultInput): Promise<PublicResponseResult> {
  try {
    const response = await submitPublicResponse({ gateway, token, input, editToken, createEditToken });

    return {
      status: 200,
      body: {
        ok: true,
        respondentId: response.respondentId,
        updatedExistingResponse: response.updatedExistingResponse,
        cardConfirmed: response.cardConfirmed,
        cardDeclined: response.cardDeclined,
      },
      editToken: response.editToken,
    };
  } catch (error) {
    const message = toErrorMessage(error);
    const isMissingCard = message === MISSING_CARD_MESSAGE;
    const isAlreadyResponded = message === ALREADY_RESPONDED_MESSAGE;
    const isUserSafe = USER_SAFE_ERROR_MESSAGES.has(message);

    return {
      status: isMissingCard ? 404 : isAlreadyResponded ? 409 : isUserSafe ? 400 : 500,
      body: {
        ok: false,
        message: isUserSafe ? message : GENERIC_RESPONSE_ERROR_MESSAGE,
      },
    };
  }
}
