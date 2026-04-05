import { getLoginType } from "./user-token";
import { isKeychainInAppBrowser } from "./keychain";

const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

function isMobileBrowser() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator?.userAgent ?? "";
  return MOBILE_USER_AGENT_PATTERN.test(ua) || window.innerWidth <= 768;
}

/**
 * Detects whether the user should use Keychain Mobile deep link flow.
 * Returns true on mobile browsers without the Keychain browser extension,
 * or for users who previously logged in via keychain-mobile.
 */
export function shouldUseKeychainMobile(username?: string): boolean {
  if (typeof window === "undefined") return false;

  if (username) {
    const loginType = getLoginType(username);
    if (loginType) {
      return loginType === "keychain-mobile";
    }
  }

  const hasKeychain = Boolean((window as any).hive_keychain);
  return isMobileBrowser() && !hasKeychain && !isKeychainInAppBrowser();
}
