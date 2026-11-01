// Notifications for a new page of a personal site (server/push.js): ask the browser for permission, subscribe with
// the site's key, tell the server. Needs a service worker (client/app.js) and Push API support (iOS: only for an
// installed web app).
export const pushSupported = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const registration = () => navigator.serviceWorker.ready;

// -> 'on' | 'off' | 'denied'
export async function pushState() {
  if(Notification.permission === 'denied') return 'denied';

  return (await (await registration()).pushManager.getSubscription()) ? 'on' : 'off';
}

const post = (url, body) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

// -> the new state
export async function setPush(on) {
  const reg = await registration();
  const existing = await reg.pushManager.getSubscription();

  if(!on) {
    if(existing) {
      await post('/api/push/unsubscribe', { endpoint: existing.endpoint });
      await existing.unsubscribe();
    }

    return 'off';
  }

  if((await Notification.requestPermission()) !== 'granted') return Notification.permission === 'denied' ? 'denied' : 'off';

  const { key } = await (await fetch('/api/push/key')).json();
  const sub = existing ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)) }));

  await post('/api/push/subscribe', { endpoint: sub.endpoint });

  return 'on';
}
