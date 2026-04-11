import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isIosSafari } from "@/features/pwa-install/is-ios-safari";

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    writable: true,
    configurable: true,
    value: ua
  });
}

describe("isIosSafari", () => {
  let originalUa: string;

  beforeEach(() => {
    originalUa = navigator.userAgent;
  });

  afterEach(() => {
    setUserAgent(originalUa);
  });

  it("returns true for real iOS Safari on iPhone", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    );
    expect(isIosSafari()).toBe(true);
  });

  it("returns true for real iOS Safari on iPad", () => {
    setUserAgent(
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    );
    expect(isIosSafari()).toBe(true);
  });

  it("returns false for Chrome on iOS (CriOS)", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1"
    );
    expect(isIosSafari()).toBe(false);
  });

  it("returns false for Firefox on iOS (FxiOS)", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15"
    );
    expect(isIosSafari()).toBe(false);
  });

  it("returns false for Edge on iOS (EdgiOS)", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.2210.126 Mobile/15E148 Safari/604.1"
    );
    expect(isIosSafari()).toBe(false);
  });

  it("returns false for Facebook in-app browser (FBAN/FBAV)", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/442.0.0.32.109;FBBV/543210;FBDV/iPhone14,3;FBMD/iPhone;FBSN/iOS;FBSV/17.0;FBSS/3;FBID/phone;FBLC/en_US]"
    );
    expect(isIosSafari()).toBe(false);
  });

  it("returns false for desktop Safari on macOS", () => {
    setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
    );
    // Desktop Safari without touch — should not be treated as iOS.
    expect(isIosSafari()).toBe(false);
  });

  it("returns false for Chrome on Android", () => {
    setUserAgent(
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    );
    expect(isIosSafari()).toBe(false);
  });

  it("returns false for Chrome on desktop", () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    expect(isIosSafari()).toBe(false);
  });
});
