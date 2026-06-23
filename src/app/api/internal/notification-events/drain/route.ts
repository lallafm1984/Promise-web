import { NextResponse } from 'next/server';

import { drainNotificationEvents } from '@/lib/notificationEventWorker';

export const runtime = 'nodejs';

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

function isAuthorized(request: Request) {
  const workerSecret = process.env.NOTIFICATION_WORKER_SECRET;

  return Boolean(workerSecret && request.headers.get('authorization') === `Bearer ${workerSecret}`);
}

function getLimit(input: unknown) {
  if (typeof input !== 'object' || input === null || !('limit' in input)) {
    return undefined;
  }

  const limit = Number((input as { limit: unknown }).limit);

  if (!Number.isFinite(limit)) {
    return undefined;
  }

  return Math.max(1, Math.min(100, Math.floor(limit)));
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const result = await drainNotificationEvents({
    limit: getLimit(await readJson(request)),
  });

  return NextResponse.json({ ok: true, ...result });
}
