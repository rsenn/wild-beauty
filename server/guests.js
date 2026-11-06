// Guests (docs/GUESTS.md): a visitor's first save makes a user without a mail address or a password,
// whose works are private to that browser. The visitor keeps them by claiming the account (auth.js
// claimRoute, or registering), or loses them after 30 days of not coming back (sweepGuests).
// This file only touches the database; the session and the cookie are auth.js's.

export const GUEST_DOMAIN = 'guest.invalid';

// the numbers of docs/GUESTS.md G4 and G7
export const GUEST_LIMITS = { nodes: 20, perClientPerDay: 20, live: 2000, keepDays: 30 };

const DAY = 24 * 3600 * 1000;
const made = new Map();

// forget the counters (tests)
export const resetGuestRates = () => made.clear();

// -> { id } for a new guest, or { error: 'too_many' | 'full' } (this client made enough today, or the guest area is full)
export function createGuest(h, client, now = Date.now()) {
  const recent = (made.get(client) ?? []).filter(t => now - t < DAY);

  if(recent.length >= GUEST_LIMITS.perClientPerDay) return { error: 'too_many' };
  if(h.get('SELECT COUNT(*) AS n FROM users WHERE guest = 1').n >= GUEST_LIMITS.live) return { error: 'full' };

  const token = crypto.randomUUID().replaceAll('-', '');
  const id = Number(h.run('INSERT INTO users (email, name, pw_hash, created_at, guest, last_seen) VALUES (?, ?, ?, ?, 1, ?)', `guest-${token}@${GUEST_DOMAIN}`, '', '!', now, now).lastInsertRowid);

  made.set(client, [...recent, now]);

  return { id };
}

// remove a guest row again (a first save that failed must not leave one behind, nor count against the client)
export function dropGuest(h, id, client) {
  h.run('DELETE FROM users WHERE id = ? AND guest = 1', id);
  made.set(client, (made.get(client) ?? []).slice(0, -1));
}

// how many works a guest holds (the limit of G4 is checked by the caller)
export const worksOf = (h, id) => h.get('SELECT COUNT(*) AS n FROM nodes WHERE owner_id = ?', id).n;

// A guest logs in to an account and takes their works along: the nodes change owner (they stay as hidden as they were), the
// guest and their sessions are gone. -> how many works moved
export function mergeGuest(h, guestId, userId) {
  return h.tx(() => {
    const moved = h.run('UPDATE nodes SET owner_id = ? WHERE owner_id = ?', userId, guestId).changes;

    h.run('DELETE FROM users WHERE id = ? AND guest = 1', guestId);

    return moved;
  });
}

// the guests nobody has seen for 30 days -> [id, ...]
export const staleGuests = (h, now = Date.now()) => h.all('SELECT id FROM users WHERE guest = 1 AND COALESCE(last_seen, created_at) < ?', now - GUEST_LIMITS.keepDays * DAY).map(r => r.id);

// Remove the stale guests with their works. `removeWork(nodeId, guestId)` deletes one node with its photos and tile
// (server/api/nodes.js removeNode); a guest whose work cannot be removed now (locked) is tried again next time.
// -> number of guests removed
export async function sweepGuests(h, removeWork, now = Date.now()) {
  let gone = 0;

  for(const id of staleGuests(h, now)) {
    const nodes = h.all('SELECT id FROM nodes WHERE owner_id = ?', id).map(r => r.id);
    let kept = false;

    for(const node of nodes) {
      const r = await removeWork(node, id);

      if(r.status !== 204 && r.status !== 404) kept = true;
    }

    if(kept) continue;

    h.run('DELETE FROM users WHERE id = ? AND guest = 1', id);
    gone++;
  }

  return gone;
}
