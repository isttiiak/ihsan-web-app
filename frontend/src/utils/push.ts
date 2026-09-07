// Web Push subscribe/unsubscribe — the browser-API half of the feature.
// Category preferences and the actual sending live on the backend
// (push.service.ts); this file only ever talks to THIS browser's own
// PushManager + service worker registration.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

// PushManager.subscribe needs the VAPID key as a Uint8Array, not the
// URL-safe base64 string web-push/browsers exchange it as.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/** Requests Notification permission (must be called from a user gesture) and
 * creates a new browser PushSubscription. Does NOT talk to the backend —
 * pair with usePushSubscribe() to persist it. Returns null if the user
 * declines permission or the browser lacks support. */
export async function createPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    // TS's DOM lib types Uint8Array generically over ArrayBufferLike as of
    // TS 5.7+, which no longer structurally matches BufferSource — the value
    // is a perfectly normal Uint8Array at runtime, this is a types-only gap.
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string) as BufferSource,
  });
}

export async function removePushSubscription(sub: PushSubscription): Promise<void> {
  await sub.unsubscribe();
}

/** Serializes a browser PushSubscription into the shape the backend expects. */
export function toSubscribePayload(sub: PushSubscription): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint ?? sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
  };
}
