import * as ls from "./local-storage";

/**
 * The active key, kept in memory for as long as the page is open.
 *
 * Active-authority operations (points tips, transfers, power ups, delegations)
 * are not covered by the posting key stored at login, so each one opens the auth
 * upgrade dialog. The key entered there used to live 60 seconds, measured from
 * the moment it was typed and never refreshed when it was used, so a second tip
 * a minute later asked for it again. It now lasts as long as the page, with a
 * sliding idle window: using the key pushes the window out, so a run of tips
 * never re-prompts, while a tab left alone drops it.
 *
 * Nothing is written to browser storage. `sessionStorage` would have carried the
 * key across a reload, but it is not the tab-scoped secret it looks like:
 * closing a tab does not destroy it, since Chrome keeps it for "reopen closed
 * tab" and for session restore while Firefox and Safari restore it too. A
 * duplicated tab also starts with a copy. A module variable has none of that. It
 * dies with the document, no other tab can reach it, it never touches disk, it
 * leaves nothing behind for an injected script to find once the page is gone.
 * The cost is one prompt after a reload. Client-side navigation between posts,
 * which is how tipping a feed actually goes, keeps the key.
 *
 * The record is scoped to the username that entered it and checked against the
 * shared `active_user` entry on every read, so a key can never sign for an
 * account other than its own.
 */

/**
 * Hive WIFs are base58. Both writers hand over a key parsed by `PrivateKey`, so
 * this only pins the invariant: a value that cannot parse would fail the
 * broadcast with an error the SDK does not read as an auth problem, so no
 * dialog would open to replace it.
 */
const KEY_SHAPE = /^[1-9A-HJ-NP-Za-km-z]{40,}$/;

/**
 * How long the key survives without being used. Every read pushes it out, so the
 * window only runs down while the user is away from active-authority work. It
 * caps how long an unattended tab keeps signing power that moves funds.
 */
const IDLE_WINDOW_MS = 2 * 60 * 60 * 1000;

interface SessionActiveKey {
  username: string;
  key: string;
}

let held: SessionActiveKey | null = null;
let lastUsedAt = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Restarts the idle window. The timer drops the key from memory, so it does not
 * sit there once the window is up; the timestamp is what actually gates a read,
 * since a background tab's timers are throttled and a suspended machine runs
 * none at all.
 */
function touch() {
  lastUsedAt = Date.now();
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
  idleTimer = setTimeout(clearSessionActiveKey, IDLE_WINDOW_MS);
}

/**
 * Holds the active key for the rest of the page. `username` defaults to the
 * active user, which is who the dialog collected the key for.
 */
export function setSessionActiveKey(key: string, username?: string) {
  // Nothing here belongs on the server: a Node process would share this module
  // state across requests.
  if (typeof window === "undefined") {
    return;
  }

  const owner = username ?? (ls.get("active_user") as string | null);
  if (!owner || !key || !KEY_SHAPE.test(key)) {
    return;
  }

  held = { username: owner, key };
  touch();
}

/**
 * Returns the held active key, but only to the account that entered it, while
 * that account is still the one logged in.
 */
export function getSessionActiveKey(username?: string): string | null {
  if (typeof window === "undefined" || !held) {
    return null;
  }

  // localStorage is shared by every tab, so an account switch made anywhere
  // invalidates a key held here.
  const activeUser = ls.get("active_user") as string | null;
  if (activeUser && held.username !== activeUser) {
    clearSessionActiveKey();
    return null;
  }

  // No readable active user is not proof of a logout: `ls.get` returns null for
  // a blocked or failing read too. Withhold the key rather than drop it. A real
  // logout clears this through setActiveUser.
  if (!activeUser) {
    return null;
  }

  // The caller names the account it is about to sign for. A mismatch is not
  // grounds for dropping the key, which still belongs to the logged-in user.
  if (username !== undefined && username !== held.username) {
    return null;
  }

  if (Date.now() - lastUsedAt > IDLE_WINDOW_MS) {
    clearSessionActiveKey();
    return null;
  }

  touch();
  return held.key;
}

/** Drops the key. Called on logout, on account switch and when the auth upgrade
 * dialog opens, at which point whatever is held has already failed to sign. */
export function clearSessionActiveKey() {
  held = null;
  lastUsedAt = 0;
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}
