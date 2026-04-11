"use client";

// Known non-Safari iOS browser and in-app webview UA tokens. All iOS browsers
// are forced to use WebKit under the hood, but only real Safari exposes a
// reliable "Share → Add to Home Screen" install flow for PWAs. Chrome iOS,
// Firefox iOS, in-app webviews (Facebook, Instagram, Line, WeChat, etc.) do
// not, so we should not show them the Safari-specific install hint.
const NON_SAFARI_IOS_TOKENS =
  /CriOS|FxiOS|EdgiOS|OPiOS|OPR\/|FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|MicroMessenger|WhatsApp|Pinterest|GSA\//i;

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports itself as a Mac — disambiguate via touch support.
  // Using `maxTouchPoints > 1` is more reliable than `"ontouchend" in document`
  // because some desktop environments (and jsdom) expose ontouchend even
  // without actual touch hardware. iPads report maxTouchPoints >= 5, real
  // desktops report 0.
  return ua.includes("Mac") && navigator.maxTouchPoints > 1;
}

/**
 * True only when the current browser is real Safari on iOS/iPadOS, where the
 * Share → Add to Home Screen install flow actually works.
 */
export function isIosSafari(): boolean {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent;
  if (NON_SAFARI_IOS_TOKENS.test(ua)) return false;
  // Real Safari always includes "Safari/<version>" in its UA string.
  return /Safari\//.test(ua);
}
