import { randomUUID } from 'node:crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { buildPublicResponseResult } from '@/lib/publicResponseRoute';
import { createSupabasePublicResponseGateway } from '@/lib/supabasePublicResponses';

export const runtime = 'nodejs';

const RESPONSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

function getResponseCookieName(token: string) {
  return `wb_response_${token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)}`;
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const cleanToken = decodeURIComponent(token);
  const cookieStore = await cookies();
  const cookieName = getResponseCookieName(cleanToken);
  const body = await readJson(request);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, message: '응답 내용을 다시 확인해 주세요.' }, { status: 400 });
  }

  const result = await buildPublicResponseResult({
    gateway: createSupabasePublicResponseGateway(),
    token: cleanToken,
    input: body,
    editToken: cookieStore.get(cookieName)?.value,
    createEditToken: () => randomUUID(),
  });

  const response = NextResponse.json(result.body, { status: result.status });

  if (result.status === 200) {
    response.cookies.set({
      name: cookieName,
      value: result.editToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: RESPONSE_COOKIE_MAX_AGE_SECONDS,
    });
  }

  return response;
}
