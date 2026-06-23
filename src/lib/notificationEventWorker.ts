import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export interface ClaimedNotificationEvent {
  id: string;
  token: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  data: Record<string, unknown>;
}

export interface ExpoPushTicket {
  status?: unknown;
  id?: unknown;
  message?: unknown;
  details?: unknown;
}

export interface NotificationEventGateway {
  claim: (limit: number) => Promise<ClaimedNotificationEvent[]>;
  sendPush: (messages: ExpoPushMessage[]) => Promise<ExpoPushTicket[]>;
  markDelivered: (eventId: string) => Promise<void>;
  markFailed: (eventId: string, errorMessage: string) => Promise<void>;
}

interface DrainNotificationEventsInput {
  gateway?: NotificationEventGateway;
  limit?: number;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const DEFAULT_CLAIM_LIMIT = 50;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown notification delivery error';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeClaimedNotificationEvents(data: unknown): ClaimedNotificationEvent[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const { id, token, title, body, data: eventData } = item;

    if (typeof id !== 'string' || typeof token !== 'string' || typeof title !== 'string' || typeof body !== 'string') {
      return [];
    }

    return [
      {
        id,
        token,
        title,
        body,
        data: isRecord(eventData) ? eventData : {},
      },
    ];
  });
}

function normalizeExpoTickets(payload: unknown): ExpoPushTicket[] {
  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data.filter(isRecord);
  }

  return isRecord(payload.data) ? [payload.data] : [];
}

function getExpoTicketError(ticket: ExpoPushTicket | undefined) {
  if (!ticket) {
    return 'Expo push ticket missing';
  }

  if (ticket.status === 'ok') {
    return null;
  }

  return typeof ticket.message === 'string' ? ticket.message : 'Expo push delivery failed';
}

function toExpoPushMessage(event: ClaimedNotificationEvent): ExpoPushMessage {
  return {
    to: event.token,
    title: event.title,
    body: event.body,
    sound: 'default',
    data: event.data,
  };
}

export function createSupabaseNotificationEventGateway(fetcher: typeof fetch = fetch): NotificationEventGateway {
  return {
    async claim(limit) {
      const { data, error } = await getSupabaseAdmin().rpc('claim_notification_events', {
        p_limit: limit,
      });

      if (error) {
        throw new Error(error.message);
      }

      return normalizeClaimedNotificationEvents(data);
    },
    async sendPush(messages) {
      if (messages.length === 0) {
        return [];
      }

      const response = await fetcher(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error(`Expo push API returned ${response.status}`);
      }

      return normalizeExpoTickets(await response.json());
    },
    async markDelivered(eventId) {
      const { error } = await getSupabaseAdmin().rpc('mark_notification_event_delivered', {
        p_event_id: eventId,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    async markFailed(eventId, errorMessage) {
      const { error } = await getSupabaseAdmin().rpc('mark_notification_event_failed', {
        p_event_id: eventId,
        p_error: errorMessage,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
  };
}

export async function drainNotificationEvents({
  gateway = createSupabaseNotificationEventGateway(),
  limit = DEFAULT_CLAIM_LIMIT,
}: DrainNotificationEventsInput = {}) {
  const events = await gateway.claim(limit);

  if (events.length === 0) {
    return {
      claimed: 0,
      delivered: 0,
      failed: 0,
    };
  }

  let tickets: ExpoPushTicket[];

  try {
    tickets = await gateway.sendPush(events.map(toExpoPushMessage));
  } catch (error) {
    const message = getErrorMessage(error);
    await Promise.all(events.map((event) => gateway.markFailed(event.id, message)));

    return {
      claimed: events.length,
      delivered: 0,
      failed: events.length,
    };
  }

  let delivered = 0;
  let failed = 0;

  await Promise.all(
    events.map(async (event, index) => {
      const ticketError = getExpoTicketError(tickets[index]);

      if (ticketError) {
        failed += 1;
        await gateway.markFailed(event.id, ticketError);
        return;
      }

      delivered += 1;
      await gateway.markDelivered(event.id);
    }),
  );

  return {
    claimed: events.length,
    delivered,
    failed,
  };
}
