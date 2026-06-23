import { createHmac } from 'node:crypto';

import type { PublicResponseRateLimitDecision } from '@/lib/publicResponseRoute';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

interface CreateRateLimitCheckInput {
  request: Request;
  token: string;
}

interface SupabaseRateLimitRow {
  allowed?: unknown;
  is_allowed?: unknown;
  retryAfterSeconds?: unknown;
  retry_after_seconds?: unknown;
}

const FALLBACK_HASH_SECRET = 'local-public-response-rate-limit';

function normalizeRetryAfterSeconds(value: unknown) {
  const retryAfterSeconds = Number(value);

  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) {
    return undefined;
  }

  return Math.ceil(retryAfterSeconds);
}

export function getRequesterAddress(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();

  return forwardedFor || realIp || 'unknown';
}

export function hashPublicResponseRateLimitKey(value: string, secret = process.env.PUBLIC_RESPONSE_RATE_LIMIT_SECRET) {
  const hashSecret = secret || process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_HASH_SECRET;

  return createHmac('sha256', hashSecret).update(value).digest('hex');
}

export function normalizePublicResponseRateLimitDecision(data: unknown): PublicResponseRateLimitDecision {
  const row = (Array.isArray(data) ? data[0] : data) as SupabaseRateLimitRow | null | undefined;
  const allowed = Boolean(row?.allowed ?? row?.is_allowed);
  const retryAfterSeconds = normalizeRetryAfterSeconds(row?.retryAfterSeconds ?? row?.retry_after_seconds);

  return {
    allowed,
    retryAfterSeconds,
  };
}

export function createSupabasePublicResponseRateLimitCheck({ request, token }: CreateRateLimitCheckInput) {
  return async (): Promise<PublicResponseRateLimitDecision> => {
    const requesterAddress = getRequesterAddress(request);
    const ipHash = hashPublicResponseRateLimitKey(`ip:${requesterAddress}`);
    const tokenIpHash = hashPublicResponseRateLimitKey(`token-ip:${token.trim()}:${requesterAddress}`);
    const { data, error } = await getSupabaseAdmin().rpc('check_public_response_rate_limit', {
      p_token_ip_hash: tokenIpHash,
      p_ip_hash: ipHash,
    });

    if (error) {
      throw new Error(error.message);
    }

    return normalizePublicResponseRateLimitDecision(data);
  };
}
