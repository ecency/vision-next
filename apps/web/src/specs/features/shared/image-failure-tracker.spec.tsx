import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import * as Sentry from "@sentry/nextjs";

vi.mock("@sentry/nextjs", () => ({
  withScope: vi.fn((cb) => cb({ setTag: vi.fn(), setLevel: vi.fn(), setExtras: vi.fn() })),
  captureMessage: vi.fn()
}));

const mockSetProxyBase = vi.fn();
vi.mock("@ecency/render-helper", async () => ({
  ...(await vi.importActual("@ecency/render-helper")),
  setProxyBase: (...args: unknown[]) => mockSetProxyBase(...args)
}));

import { ImageFailureTracker, _resetImageProxyFallback } from "@/app/_components/image-failure-tracker";

const PRIMARY_HOST = "images.ecency.com";
const FALLBACK_HOST = "img.ecency.com";
let urlCounter = 0;

function uniqueImageUrl() {
  return `https://${PRIMARY_HOST}/img/${++urlCounter}.png`;
}

function fireImageError(src: string) {
  const img = document.createElement("img");
  Object.defineProperty(img, "src", { value: src, writable: true });
  const event = new Event("error", { bubbles: false });
  Object.defineProperty(event, "target", { value: img });
  document.dispatchEvent(event);
  return img;
}

function fireNonImageError() {
  const script = document.createElement("script");
  const event = new Event("error", { bubbles: false });
  Object.defineProperty(event, "target", { value: script });
  document.dispatchEvent(event);
}

// Stub the Image constructor so the probe doesn't interfere with tests
let probeInstances: Array<{ onload?: (() => void) | null; onerror?: (() => void) | null; src: string }> = [];

describe("ImageFailureTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetImageProxyFallback();
    mockSetProxyBase.mockClear();
    probeInstances = [];
    urlCounter = 0;

    // Mock Image so probe doesn't fire automatically
    vi.stubGlobal(
      "Image",
      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = "";

        constructor() {
          probeInstances.push(this);
        }
      }
    );

    vi.useFakeTimers();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rewrites failed image src to fallback host", () => {
    render(<ImageFailureTracker />);

    const src = uniqueImageUrl();
    const img = fireImageError(src);

    expect(img.src).toBe(src.replace(PRIMARY_HOST, FALLBACK_HOST));
  });

  it("does not retry the same element twice", () => {
    render(<ImageFailureTracker />);

    const src = uniqueImageUrl();
    const img = fireImageError(src);
    expect(img.src).toContain(FALLBACK_HOST);

    // Re-fire error on the SAME element — should not rewrite again
    Object.defineProperty(img, "src", { value: src, writable: true });
    const event = new Event("error", { bubbles: false });
    Object.defineProperty(event, "target", { value: img });
    document.dispatchEvent(event);

    expect(img.src).toBe(src);
  });

  it("retries different elements with the same URL", () => {
    render(<ImageFailureTracker />);

    const src = uniqueImageUrl();
    const img1 = fireImageError(src);
    expect(img1.src).toContain(FALLBACK_HOST);

    // A different element with the same URL should also get retried
    const img2 = fireImageError(src);
    expect(img2.src).toContain(FALLBACK_HOST);
  });

  it("switches globally after threshold unique failures", () => {
    render(<ImageFailureTracker />);

    act(() => {
      fireImageError(uniqueImageUrl());
      fireImageError(uniqueImageUrl());
      fireImageError(uniqueImageUrl());
    });

    expect(mockSetProxyBase).toHaveBeenCalledWith(`https://${FALLBACK_HOST}`);
    expect(sessionStorage.getItem("image_proxy_fallback_active")).toBe("1");
  });

  it("reports to Sentry on global fallback activation", () => {
    render(<ImageFailureTracker />);

    act(() => {
      fireImageError(uniqueImageUrl());
      fireImageError(uniqueImageUrl());
      fireImageError(uniqueImageUrl());
    });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining(FALLBACK_HOST)
    );
  });

  it("ignores errors from non-HTMLImageElement targets", () => {
    render(<ImageFailureTracker />);

    act(() => {
      fireNonImageError();
    });

    expect(mockSetProxyBase).not.toHaveBeenCalled();
  });

  it("ignores image errors from non-matching hosts", () => {
    render(<ImageFailureTracker />);

    act(() => {
      fireImageError("https://other-cdn.example.com/photo.jpg");
    });

    expect(mockSetProxyBase).not.toHaveBeenCalled();
  });

  it("applies cached fallback from sessionStorage on render", () => {
    sessionStorage.setItem("image_proxy_fallback_active", "1");

    render(<ImageFailureTracker />);

    expect(mockSetProxyBase).toHaveBeenCalledWith(`https://${FALLBACK_HOST}`);
  });

  it("switches to fallback when probe fails", () => {
    render(<ImageFailureTracker />);

    // Simulate probe failure
    act(() => {
      probeInstances[0]?.onerror?.();
    });

    expect(mockSetProxyBase).toHaveBeenCalledWith(`https://${FALLBACK_HOST}`);
  });

  it("does not switch when probe succeeds", () => {
    render(<ImageFailureTracker />);

    act(() => {
      probeInstances[0]?.onload?.();
    });

    expect(mockSetProxyBase).not.toHaveBeenCalled();
  });

  it("switches to fallback on probe timeout", () => {
    render(<ImageFailureTracker />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(mockSetProxyBase).toHaveBeenCalledWith(`https://${FALLBACK_HOST}`);
  });

  it("skips probe and auto-fallback when user has non-default proxy (images.hive.blog)", () => {
    // Simulate user having explicitly chosen images.hive.blog
    localStorage.setItem("image_proxy", JSON.stringify("https://images.hive.blog"));

    render(<ImageFailureTracker />);

    // Probe should not have been created
    expect(probeInstances).toHaveLength(0);

    // Even with probe timeout, no switch should happen
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(mockSetProxyBase).not.toHaveBeenCalled();

    // Error handler should still be registered but won't act on images.hive.blog URLs
    act(() => {
      fireImageError("https://images.hive.blog/p/abc123");
    });
    expect(mockSetProxyBase).not.toHaveBeenCalled();
  });

  it("skips cached fallback from sessionStorage when user has non-default proxy", () => {
    sessionStorage.setItem("image_proxy_fallback_active", "1");
    localStorage.setItem("image_proxy", JSON.stringify("https://images.hive.blog"));

    render(<ImageFailureTracker />);

    // Should NOT apply the cached fallback since user has a custom proxy
    expect(mockSetProxyBase).not.toHaveBeenCalled();
  });

  it("treats invalid image_proxy values as no override and runs probe", () => {
    localStorage.setItem("image_proxy", JSON.stringify("https://some-garbage.com"));

    render(<ImageFailureTracker />);

    // Probe should still be created since the stored value is not in ALLOWED_IMAGE_SERVERS
    expect(probeInstances).toHaveLength(1);

    // Fallback should still work normally
    act(() => {
      probeInstances[0]?.onerror?.();
    });
    expect(mockSetProxyBase).toHaveBeenCalledWith(`https://${FALLBACK_HOST}`);
  });

  it("rewrites SSR-rendered img elements on hydration when fallback is cached", () => {
    sessionStorage.setItem("image_proxy_fallback_active", "1");

    // Simulate SSR-rendered img elements already in the DOM
    const img1 = document.createElement("img");
    img1.src = `https://${PRIMARY_HOST}/p/abc123?format=match`;
    const img2 = document.createElement("img");
    img2.src = `https://${PRIMARY_HOST}/u/user1/avatar/medium`;
    document.body.appendChild(img1);
    document.body.appendChild(img2);

    render(<ImageFailureTracker />);

    expect(img1.src).toContain(FALLBACK_HOST);
    expect(img2.src).toContain(FALLBACK_HOST);

    document.body.removeChild(img1);
    document.body.removeChild(img2);
  });
});
