/**
 * Imperative API for the auth upgrade dialog.
 *
 * Used by the web broadcast adapter to show a dialog when the user needs to
 * provide a different auth method (e.g., active key for an active-key operation
 * when logged in with posting key only).
 *
 * Pattern follows the existing feedback system (CustomEvent-based imperative UI).
 */

type AuthMethod = "hiveauth" | "hivesigner" | "keychain" | "key" | false;

let pendingResolve: ((method: AuthMethod) => void) | null = null;
let tempActiveKey: string | null = null;
let tempKeyTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Called by the broadcast adapter's showAuthUpgradeUI to show the dialog and wait for user choice.
 */
export function requestAuthUpgrade(
  authority: string,
  operation: string
): Promise<AuthMethod> {
  // If there's already a pending request, cancel it so it doesn't hang forever
  if (pendingResolve) {
    pendingResolve(false);
    pendingResolve = null;
  }

  // Clear any stale temp key from a previous flow
  clearTempActiveKey();

  return new Promise((resolve) => {
    pendingResolve = resolve;
    window.dispatchEvent(
      new CustomEvent("ecency-auth-upgrade", {
        detail: { authority, operation }
      })
    );
  });
}

/**
 * Called by the dialog when the user makes a choice (or cancels).
 */
export function resolveAuthUpgrade(method: AuthMethod, key?: string) {
  if (key) {
    tempActiveKey = key;
    // Safety: clear the key after 60s to prevent stale keys lingering in memory
    if (tempKeyTimeout) clearTimeout(tempKeyTimeout);
    tempKeyTimeout = setTimeout(clearTempActiveKey, 60_000);
  }
  pendingResolve?.(method);
  pendingResolve = null;
}

/**
 * Called by adapter.getActiveKey() to retrieve the key entered in the dialog.
 * Non-destructive read — key persists for retries within the same auth flow.
 */
export function getTempActiveKey(): string | null {
  return tempActiveKey;
}

/**
 * Clears the temp active key. Called after successful broadcast or when a new
 * auth upgrade flow starts.
 */
export function clearTempActiveKey() {
  tempActiveKey = null;
  if (tempKeyTimeout) {
    clearTimeout(tempKeyTimeout);
    tempKeyTimeout = null;
  }
}

/** @deprecated Use getTempActiveKey() instead — non-destructive read */
export const consumeTempActiveKey = getTempActiveKey;
