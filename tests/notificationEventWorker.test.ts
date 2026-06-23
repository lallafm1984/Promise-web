import { describe, expect, it, vi } from 'vitest';

import { drainNotificationEvents, type NotificationEventGateway } from '@/lib/notificationEventWorker';

function createGateway(overrides: Partial<NotificationEventGateway> = {}): NotificationEventGateway {
  return {
    claim: vi.fn().mockResolvedValue([
      {
        id: 'event-ok',
        token: 'ExponentPushToken[ok]',
        title: 'Title',
        body: 'Body',
        data: { url: '/friends', type: 'friend_request', id: 'request-1' },
      },
      {
        id: 'event-failed',
        token: 'ExponentPushToken[failed]',
        title: 'Title',
        body: 'Body',
        data: { url: '/manage', type: 'card_received', id: 'card-1' },
      },
    ]),
    sendPush: vi.fn().mockResolvedValue([
      { status: 'ok', id: 'expo-ticket-ok' },
      { status: 'error', message: 'DeviceNotRegistered' },
    ]),
    markDelivered: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('drainNotificationEvents', () => {
  it('sends claimed notification events in a batch and marks each ticket result', async () => {
    const gateway = createGateway();

    await expect(drainNotificationEvents({ gateway, limit: 25 })).resolves.toEqual({
      claimed: 2,
      delivered: 1,
      failed: 1,
    });

    expect(gateway.claim).toHaveBeenCalledWith(25);
    expect(gateway.sendPush).toHaveBeenCalledWith([
      {
        to: 'ExponentPushToken[ok]',
        title: 'Title',
        body: 'Body',
        sound: 'default',
        data: { url: '/friends', type: 'friend_request', id: 'request-1' },
      },
      {
        to: 'ExponentPushToken[failed]',
        title: 'Title',
        body: 'Body',
        sound: 'default',
        data: { url: '/manage', type: 'card_received', id: 'card-1' },
      },
    ]);
    expect(gateway.markDelivered).toHaveBeenCalledWith('event-ok');
    expect(gateway.markFailed).toHaveBeenCalledWith('event-failed', 'DeviceNotRegistered');
  });

  it('marks all claimed events as failed when the Expo batch request fails', async () => {
    const gateway = createGateway({
      sendPush: vi.fn().mockRejectedValue(new Error('Expo API unavailable')),
    });

    await expect(drainNotificationEvents({ gateway })).resolves.toEqual({
      claimed: 2,
      delivered: 0,
      failed: 2,
    });

    expect(gateway.markDelivered).not.toHaveBeenCalled();
    expect(gateway.markFailed).toHaveBeenCalledWith('event-ok', 'Expo API unavailable');
    expect(gateway.markFailed).toHaveBeenCalledWith('event-failed', 'Expo API unavailable');
  });
});
