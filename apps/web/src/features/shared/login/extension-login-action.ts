import type { DetectedExtension, HiveExtensionId } from "@/utils/hive-extensions";

export type ExtensionLoginAction =
  | { kind: "install" }
  | { kind: "needUsername" }
  | { kind: "picker" }
  | { kind: "login"; extId?: HiveExtensionId };

/**
 * Pure decision for the login "Extensions" button. Kept out of the component so
 * the branching (the bug-prone part) is unit-testable without rendering.
 *
 * - no extension detected and no Keychain-mobile fallback -> guide to install
 * - no username yet -> ask for it first
 * - 2+ extensions -> always show the picker, so the user chooses the wallet that
 *   holds THIS account's keys. We never auto-route by a saved preference here: a
 *   login can target a different account than last time, and signing with the
 *   wrong extension would fail.
 * - exactly one extension (or Keychain-mobile) -> sign with it directly
 */
export function decideExtensionLoginAction(
  detected: DetectedExtension[],
  username: string,
  useKeychainMobile: boolean
): ExtensionLoginAction {
  if (detected.length === 0 && !useKeychainMobile) return { kind: "install" };
  if (!username) return { kind: "needUsername" };
  if (detected.length > 1) return { kind: "picker" };
  return { kind: "login", extId: detected[0]?.id };
}
