import { decodeObj, encodeObj } from "./encoder";
import * as ls from "./local-storage";

/**
 * The active key, kept for the life of one browser tab.
 *
 * Active-authority operations (points tips, transfers, power ups, delegations)
 * are not covered by the posting key stored at login, so each one opens the auth
 * upgrade dialog. The key entered there used to live 60 seconds in memory, which
 * meant anyone sending more than one tip in a sitting retyped it for every
 * single tip. It now lives until the tab is closed.
 *
 * `sessionStorage` is the point, not an implementation detail: the browser drops
 * it when the tab closes, so the key cannot outlive the session it was typed
 * into the way a `localStorage` value would. Isolation is not absolute, since a
 * tab duplicated from this one inherits a copy of the record, so every read also
 * checks the `active_user` entry in localStorage, which all tabs share. A logout
 * or an account switch in any tab therefore invalidates every copy at once, and
 * a key can never sign for an account other than the one that entered it.
 */

const STORAGE_KEY = `${ls.PREFIX}_active-key-session`;

interface SessionActiveKey {
  username: string;
  key: string;
}

/**
 * Mirrors the stored record so signing still works where `sessionStorage` throws
 * or is empty by policy (private windows, blocked site data). There the key
 * simply lasts as long as the page stays loaded.
 */
let cached: SessionActiveKey | null = null;

function resolveUsername(username?: string): string | null {
  return username ?? (ls.get("active_user") as string | null);
}

function read(): SessionActiveKey | null {
  // Nothing about this store belongs on the server: `cached` is module state
  // that a Node process would share across requests.
  if (typeof window === "undefined") {
    return null;
  }

  if (cached) {
    return cached;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const decoded = decodeObj(raw) as SessionActiveKey | undefined;
    if (!decoded?.username || !decoded?.key) {
      return null;
    }

    // A record edited by hand would otherwise wedge every later broadcast: a key
    // that cannot parse fails with an error the SDK does not read as an auth
    // problem, so no dialog would ever open to replace it. Refusing it here
    // turns that into a plain re-prompt.
    if (!/^[1-9A-HJ-NP-Za-km-z]{40,}$/.test(decoded.key)) {
      return null;
    }

    cached = decoded;
    return cached;
  } catch (e) {
    return null;
  }
}

/**
 * Stores the active key for the rest of the tab session. `username` defaults to
 * the active user, which is who the dialog collected the key for.
 */
export function setSessionActiveKey(key: string, username?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const owner = resolveUsername(username);
  if (!owner || !key) {
    return;
  }

  cached = { username: owner, key };

  try {
    sessionStorage.setItem(STORAGE_KEY, encodeObj(cached));
  } catch (e) {
    // Storage unavailable. The in-memory copy above still covers this page.
  }
}

/**
 * Returns the stored active key, but only to the account that entered it, and
 * only while that account is still the one logged in.
 */
export function getSessionActiveKey(username?: string): string | null {
  const stored = read();
  if (!stored) {
    return null;
  }

  // localStorage is shared by every tab, so this is what invalidates a copy that
  // a duplicated tab inherited: once the user logs out or switches accounts
  // anywhere, no tab will hand the old account's key to a broadcast again.
  const activeUser = ls.get("active_user") as string | null;
  if (!activeUser || stored.username !== activeUser) {
    clearSessionActiveKey();
    return null;
  }

  // The caller names the account it is about to sign for. A mismatch is not
  // grounds for dropping the record, which still belongs to the logged-in user.
  if (username && username !== stored.username) {
    return null;
  }

  return stored.key;
}

/** Drops the key. Called on logout, on account switch and when the auth upgrade
 * dialog opens, at which point whatever is stored has already failed to sign. */
export function clearSessionActiveKey() {
  cached = null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}
