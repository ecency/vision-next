/**
 * Imperative API for the auth upgrade dialog.
 *
 * Used by the web broadcast adapter to show a dialog when the user needs to
 * provide a different auth method (e.g., active key for an active-key operation
 * when logged in with posting key only).
 *
 * Pattern follows the existing feedback system (CustomEvent-based imperative UI).
 */

type AuthMethod = "hiveauth" | "hivesigner" | "key" | false;

let pendingResolve: ((method: AuthMethod) => void) | null = null;
let tempActiveKey: string | null = null;

/**
 * Called by the broadcast adapter's showAuthUpgradeUI to show the dialog and wait for user choice.
 */
export function requestAuthUpgrade(
  authority: string,
  operation: string
): Promise<AuthMethod> {
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
  if (key) tempActiveKey = key;
  pendingResolve?.(method);
  pendingResolve = null;
}

/**
 * Called by adapter.getActiveKey() to retrieve the key entered in the dialog.
 * Consumes (clears) the key after reading.
 */
export function consumeTempActiveKey(): string | null {
  const key = tempActiveKey;
  tempActiveKey = null;
  return key;
}
