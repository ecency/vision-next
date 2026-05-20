/**
 * Imperative API for the memo key dialog.
 *
 * Used by the memo crypto helper to prompt the user for their memo private key
 * when encrypting or decrypting memos.
 *
 * Pattern follows the auth-upgrade system (CustomEvent-based imperative UI).
 */

// Safety net: if no MemoKeyDialog is mounted to handle the request, or the
// user simply walks away, resolve with `false` instead of leaving the
// returned Promise pending forever.
const MEMO_KEY_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

let pendingResolve: ((key: string | false) => void) | null = null;
let pendingRequestTimeout: ReturnType<typeof setTimeout> | null = null;
let tempMemoKey: string | null = null;
let tempKeyTimeout: ReturnType<typeof setTimeout> | null = null;

function clearPendingRequest() {
  if (pendingRequestTimeout) {
    clearTimeout(pendingRequestTimeout);
    pendingRequestTimeout = null;
  }
  pendingResolve = null;
}

/**
 * Show the memo key dialog and wait for user input.
 * Returns the memo private key (WIF) or false if the user cancels or the
 * dialog never resolves within MEMO_KEY_REQUEST_TIMEOUT_MS.
 */
export function requestMemoKey(
  purpose: "encrypt" | "decrypt"
): Promise<string | false> {
  if (pendingResolve) {
    pendingResolve(false);
  }
  clearPendingRequest();
  clearTempMemoKey();

  return new Promise((resolve) => {
    pendingResolve = resolve;
    pendingRequestTimeout = setTimeout(() => {
      if (pendingResolve === resolve) {
        clearPendingRequest();
        clearTempMemoKey();
        resolve(false);
      }
    }, MEMO_KEY_REQUEST_TIMEOUT_MS);
    window.dispatchEvent(
      new CustomEvent("ecency-memo-key", {
        detail: { purpose }
      })
    );
  });
}

/**
 * Called by the dialog when the user provides a key or cancels.
 */
export function resolveMemoKey(key: string | false) {
  if (typeof key === "string" && key) {
    tempMemoKey = key;
    if (tempKeyTimeout) clearTimeout(tempKeyTimeout);
    tempKeyTimeout = setTimeout(clearTempMemoKey, 60_000);
  }
  const resolve = pendingResolve;
  clearPendingRequest();
  resolve?.(key);
}

/**
 * Retrieve the cached memo key (non-destructive read).
 */
export function getTempMemoKey(): string | null {
  return tempMemoKey;
}

/**
 * Clear the cached memo key.
 */
export function clearTempMemoKey() {
  tempMemoKey = null;
  if (tempKeyTimeout) {
    clearTimeout(tempKeyTimeout);
    tempKeyTimeout = null;
  }
}
