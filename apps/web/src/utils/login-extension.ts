import { LoginType } from "@/entities";
import { getPreferredExtensionId } from "@/utils/hive-extensions";

/**
 * Display-only login kinds: the stored auth `LoginType` plus the specific
 * browser extension behind a "keychain" login.
 *
 * All browser extensions (Keychain, Hive Keeper, Peak Vault) are persisted as
 * loginType "keychain" because they share the Keychain-compatible auth path
 * (memo encrypt/decrypt, broadcast adapter, operations all branch on
 * `loginType === "keychain"`). The stored auth type must therefore stay
 * "keychain"; the specific wallet is only resolved for display.
 */
export type ExtensionAwareLoginType = LoginType | "keeper" | "peakvault";

/**
 * Resolve which extension a "keychain" login actually used, for DISPLAY only.
 *
 * Reads the account's saved per-user extension preference (the login flow
 * records it for every extension login). Only desktop "keychain" is refined --
 * "keychain-mobile" is the mobile deep-link path and keeps its Keychain
 * identity, never inheriting a desktop extension preference. Returns the input
 * loginType unchanged for every other case. SSR-safe: `getPreferredExtensionId`
 * returns null without `window`, so this falls back to the stored type.
 */
export function resolveExtensionAwareLoginType(
  loginType: string | null | undefined,
  username: string
): ExtensionAwareLoginType | null | undefined {
  if (loginType === "keychain") {
    const extId = getPreferredExtensionId(username);
    if (extId === "hive-keeper") return "keeper";
    if (extId === "peakvault") return "peakvault";
  }
  // Pass through the stored value unchanged (it is a LoginType in practice;
  // getLoginType is loosely typed as string).
  return loginType as ExtensionAwareLoginType | null | undefined;
}
