/**
 * Imperative API for the memo key dialog.
 *
 * Used by the memo crypto helper to prompt the user for their memo private key
 * when encrypting or decrypting memos.
 *
 * Pattern follows the auth-upgrade system (CustomEvent-based imperative UI).
 */

let pendingResolve: ((key: string | false) => void) | null = null;
let tempMemoKey: string | null = null;
let tempKeyTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Show the memo key dialog and wait for user input.
 * Returns the memo private key (WIF) or false if the user cancels.
 */
export function requestMemoKey(
  purpose: "encrypt" | "decrypt"
): Promise<string | false> {
  if (pendingResolve) {
    pendingResolve(false);
    pendingResolve = null;
  }

  clearTempMemoKey();

  return new Promise((resolve) => {
    pendingResolve = resolve;
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
  pendingResolve?.(key);
  pendingResolve = null;
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
