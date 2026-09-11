import { decodeObj, encodeObj } from "./encoder";
import * as ls from "./local-storage";

/**
 * The active key, kept for the life of one browser tab.
 *
 * Active-authority operations (points tips, transfers, power ups, delegations)
 * are not covered by the posting key stored at login, so each one opens the auth
 * upgrade dialog. The key entered there used to live 60 seconds in memory, which
 * meant anyone sending more than one tip in a sitting retyped it for every
 * single tip. It now lives until the tab goes away.
 *
 * Two browser behaviours make "one tab" weaker than it sounds, so neither is
 * trusted to `sessionStorage` alone:
 *
 * - Closing a tab does not destroy its session storage. Chrome keeps it on disk
 *   for "reopen closed tab" and for "continue where you left off". Firefox and
 *   Safari bring it back through session restore too, so a plain record would
 *   return with the tab hours later, on a shared machine included.
 * - A tab duplicated from this one starts life with a copy of the record.
 *
 * So a stored record is accepted by a new document only when the document that
 * held it stamped it on `pagehide` shortly before. A reload or a short trip to
 * another page carries that stamp across; a reopened or duplicated tab finds no
 * fresh stamp and asks for the key again.
 *
 * What this is not: encryption. The record is base64-encoded, the same way the
 * app already stores the posting key, so anything running inside the page can
 * read it for as long as it is held.
 */

const STORAGE_KEY = `${ls.PREFIX}_active-key-session`;

/**
 * How long a stamped record stays acceptable after the document that held it
 * went away. Long enough for a reload or a short visit to another page, short
 * enough that a tab reopened later starts without a key.
 */
const HANDOFF_GRACE_MS = 60_000;

/**
 * Hive WIFs are base58. A record edited by hand would otherwise wedge every
 * later broadcast: a key that cannot parse fails with an error the SDK does not
 * read as an auth problem, so no dialog would open to replace it.
 */
const KEY_SHAPE = /^[1-9A-HJ-NP-Za-km-z]{40,}$/;

interface SessionActiveKey {
  username: string;
  key: string;
  /**
   * Set on `pagehide` by the document that held the key, then stripped again
   * by the document that picks it up. Absent while a document is holding it, so
   * the copy a duplicated tab inherits is never accepted.
   */
  handoff?: number;
}

/**
 * Mirrors the stored record so signing still works where `sessionStorage` throws
 * or is empty by policy (private windows, blocked site data). There the key
 * simply lasts as long as the page stays loaded.
 */
let cached: SessionActiveKey | null = null;
/** Whether this document has already decided about the record it found. */
let adopted = false;
let handoffBound = false;

function writeRecord(record: SessionActiveKey) {
  try {
    sessionStorage.setItem(STORAGE_KEY, encodeObj(record));
  } catch (e) {
    // Storage unavailable. The in-memory copy still covers this page.
  }
}

/**
 * Hands the key to the next document in this tab. A reload fires `pagehide` and
 * loads again within the grace window; a tab that is closed for good never gets
 * a next document, so the stamp goes stale where it lies.
 */
function bindHandoff() {
  if (handoffBound || typeof window === "undefined") {
    return;
  }
  handoffBound = true;
  window.addEventListener("pagehide", () => {
    if (cached) {
      writeRecord({ ...cached, handoff: Date.now() });
    }
  });
}

/** Decides once per document whether the stored record may be picked up. */
function adopt(): SessionActiveKey | null {
  adopted = true;

  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
  if (!raw) {
    return null;
  }

  let decoded: SessionActiveKey | undefined;
  try {
    decoded = decodeObj(raw) as SessionActiveKey | undefined;
  } catch (e) {
    decoded = undefined;
  }

  if (!decoded?.username || !decoded?.key || !KEY_SHAPE.test(decoded.key)) {
    clearSessionActiveKey();
    return null;
  }

  if (!decoded.handoff || Date.now() - decoded.handoff > HANDOFF_GRACE_MS) {
    // Nothing handed this over: a reopened tab, a duplicated one, or a document
    // that went away without running its handler.
    clearSessionActiveKey();
    return null;
  }

  cached = { username: decoded.username, key: decoded.key };
  // Strip the stamp so the grace window cannot be extended by reopening again.
  writeRecord(cached);
  bindHandoff();
  return cached;
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

  return adopted ? null : adopt();
}

/**
 * Stores the active key for the rest of the tab session. `username` defaults to
 * the active user, which is who the dialog collected the key for.
 */
export function setSessionActiveKey(key: string, username?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const owner = username ?? (ls.get("active_user") as string | null);
  if (!owner || !key || !KEY_SHAPE.test(key)) {
    return;
  }

  adopted = true;
  cached = { username: owner, key };
  writeRecord(cached);
  bindHandoff();
}

/**
 * Returns the stored active key, but only to the account that entered it, while
 * that account is still the one logged in.
 */
export function getSessionActiveKey(username?: string): string | null {
  const stored = read();
  if (!stored) {
    return null;
  }

  // localStorage is shared by every tab, so this is what invalidates a copy that
  // outlived the account it belongs to: once the user switches accounts
  // anywhere, no tab will hand the old account's key to a broadcast again.
  const activeUser = ls.get("active_user") as string | null;
  if (activeUser && stored.username !== activeUser) {
    clearSessionActiveKey();
    return null;
  }

  // No readable active user is not proof of a logout: `ls.get` returns null for
  // a blocked or failing read too. Withhold the key rather than destroy it. A
  // real logout clears the store through setActiveUser.
  if (!activeUser) {
    return null;
  }

  // The caller names the account it is about to sign for. A mismatch is not
  // grounds for dropping the record, which still belongs to the logged-in user.
  if (username !== undefined && username !== stored.username) {
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
