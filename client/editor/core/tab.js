// A name for this browser tab, sent as `x-wb-tab` with the requests that take
// part in locking (EDITOR.md S2.8): the session cookie is shared by all tabs of
// a browser, so without it a second tab would hold the same lock. It survives a
// reload of the tab (sessionStorage), so a reload does not lock itself out.
let id = null;

const random = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');

export function tabId() {
  if(id) return id;

  try {
    id = globalThis.sessionStorage?.getItem('wb-tab') ?? null;
  } catch {}

  if(!id || !/^[0-9a-f]{16}$/.test(id)) {
    id = random();

    try {
      globalThis.sessionStorage?.setItem('wb-tab', id);
    } catch {}
  }

  return id;
}

export const tabHeaders = extra => ({ 'x-wb-tab': tabId(), ...extra });
