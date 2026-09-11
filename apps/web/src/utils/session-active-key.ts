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
 * it when the tab closes and never shares it with another tab, so the key cannot
 * outlive the session it was typed into the way a `localStorage` value would.
 * The record is scoped to the username that entered it, so a key can never sign
 * for an account the user switched to afterwards.
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
  if (cached) {
    return cached;
  }

  if (typeof window === "undefined") {
    return null;
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
  const owner = resolveUsername(username);
  if (!owner || !key) {
    return;
  }

  cached = { username: owner, key };

  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, encodeObj(cached));
  } catch (e) {
    // Storage unavailable. The in-memory copy above still covers this page.
  }
}

/**
 * Returns the stored active key, but only to the account that entered it. A
 * mismatch means the user switched accounts, so the key is dropped instead of
 * being handed to a broadcast it cannot sign.
 */
export function getSessionActiveKey(username?: string): string | null {
  const stored = read();
  if (!stored) {
    return null;
  }

  const owner = resolveUsername(username);
  if (!owner || stored.username !== owner) {
    clearSessionActiveKey();
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
