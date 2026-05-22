import type { TxResponse } from "@/types";

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

/**
 * Builds a meaningful error message from a Keychain-style failure response.
 *
 * Keychain-compatible extensions return the human-readable reason in `message`
 * and the underlying node/RPC error in `error` (a string code or an object).
 * We surface both so the user sees the real cause, and so the SDK's error
 * classifier (`parseChainError` / `shouldTriggerAuthFallback`) can detect cases
 * like a missing active authority and trigger the auth-upgrade flow instead of
 * hard-failing on a generic, unmatchable string.
 */
export function extensionErrorMessage(
  resp: Pick<TxResponse, "message" | "error">,
  fallback: string
): string {
  const parts: string[] = [];
  if (resp.message) {
    parts.push(String(resp.message));
  }
  if (resp.error != null) {
    const detail =
      typeof resp.error === "string" ? resp.error : safeStringify(resp.error);
    if (detail && detail !== "{}" && !parts.includes(detail)) {
      parts.push(detail);
    }
  }
  return parts.join(" — ") || fallback;
}

/**
 * True when a Keychain-style failure represents the user declining/cancelling
 * the request (rather than a node, network, or validation error). Used to avoid
 * pointless broadcast retries that would re-open the extension popup.
 */
export function isUserCancellation(
  resp: Pick<TxResponse, "message" | "error">
): boolean {
  const error = typeof resp.error === "string" ? resp.error.toLowerCase() : "";
  const message = (resp.message ?? "").toLowerCase();
  return (
    error === "user_cancel" ||
    error.includes("cancel") ||
    message.includes("cancel") ||
    message.includes("declined")
  );
}
