// Who is using the page: the user the server rendered it for, kept current. A visitor becomes a guest at
// their first save (docs/GUESTS.md G1), so the nav, the dialog and the editor have to learn it then.
import { useEffect, useState } from '../vendor/hooks.js';
import { useBoot } from './boot.js';

export const ACCOUNT_CHANGED = 'wb:account-changed';
export const OPEN_ACCOUNT = 'wb:open-account';

// the editor made the visitor a guest, or the account changed: everybody who shows it asks again
export const accountChanged = () => window.dispatchEvent(new CustomEvent(ACCOUNT_CHANGED));

// something needs an account (publishing as a guest): open the dialog
export const openAccount = () => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT));

// the current user: { id, name, ..., guest?, works?, until? } or null
export function useAccount() {
  const { user } = useBoot();
  const [me, setMe] = useState(user ?? null);

  useEffect(() => {
    const refresh = () =>
      fetch('/api/me', { headers: { accept: 'application/json' } })
        .then(res => res.json())
        .then(body => setMe(body.user ?? null))
        .catch(() => {});

    window.addEventListener(ACCOUNT_CHANGED, refresh);

    return () => window.removeEventListener(ACCOUNT_CHANGED, refresh);
  }, []);

  return me;
}

// the day a guest's works would be removed, as a date in the page's language
export const keptUntil = (user, lang) => (user?.until ? new Date(user.until).toLocaleDateString(lang, { day: 'numeric', month: 'long' }) : '');
