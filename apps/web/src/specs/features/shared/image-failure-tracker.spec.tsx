import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import * as Sentry from "@sentry/nextjs";

vi.mock("@sentry/nextjs", () => ({
  withScope: vi.fn((cb) => cb({ setTag: vi.fn(), setLevel: vi.fn(), setExtras: vi.fn() })),
  captureMessage: vi.fn()
}));

import { ImageFailureTracker } from "@/app/_components/image-failure-tracker";

const IMAGE_HOST = "images.ecency.com";
let urlCounter = 0;

function uniqueImageUrl() {
  return `https://${IMAGE_HOST}/img/${++urlCounter}.png`;
}

function fireImageError(src: string) {
  const img = document.createElement("img");
  Object.defineProperty(img, "src", { value: src, writable: false });
  const event = new Event("error", { bubbles: false });
  Object.defineProperty(event, "target", { value: img });
  document.dispatchEvent(event);
}

function fireNonImageError() {
  const script = document.createElement("script");
  const event = new Event("error", { bubbles: false });
  Object.defineProperty(event, "target", { value: script });
  document.dispatchEvent(event);
}

describe("ImageFailureTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0); // always below sample rate
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reports to Sentry when an image from IMAGE_HOST fails", () => {
    render(<ImageFailureTracker />);

    const src = uniqueImageUrl();
    act(() => {
      fireImageError(src);
    });

    expect(Sentry.withScope).toHaveBeenCalledOnce();
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining(IMAGE_HOST)
    );

    // Verify scope was configured with correct tags and extras
    interface MockScope {
      setTag: ReturnType<typeof vi.fn>;
      setLevel: ReturnType<typeof vi.fn>;
      setExtras: ReturnType<typeof vi.fn>;
    }
    const scopeCb = vi.mocked(Sentry.withScope).mock.calls[0][0] as unknown as (scope: MockScope) => void;
    const mockScope: MockScope = {
      setTag: vi.fn(),
      setLevel: vi.fn(),
      setExtras: vi.fn()
    };
    scopeCb(mockScope);

    expect(mockScope.setTag).toHaveBeenCalledWith("failure_type", "image_load");
    expect(mockScope.setTag).toHaveBeenCalledWith("image_host", IMAGE_HOST);
    expect(mockScope.setExtras).toHaveBeenCalledWith(
      expect.objectContaining({
        image_src: src,
        page_url: expect.any(String),
        online: expect.any(Boolean)
      })
    );
  });

  it("ignores errors from non-HTMLImageElement targets", () => {
    render(<ImageFailureTracker />);

    act(() => {
      fireNonImageError();
    });

    expect(Sentry.withScope).not.toHaveBeenCalled();
  });

  it("ignores image errors from non-matching hosts", () => {
    render(<ImageFailureTracker />);

    act(() => {
      fireImageError("https://other-cdn.example.com/photo.jpg");
    });

    expect(Sentry.withScope).not.toHaveBeenCalled();
  });

  it("deduplicates rapid errors for the same src", () => {
    render(<ImageFailureTracker />);

    const src = uniqueImageUrl();
    act(() => {
      fireImageError(src);
      fireImageError(src);
    });

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);

    // After DEBOUNCE_MS, the same URL can report again
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      fireImageError(src);
    });

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2);
  });

  it("respects sampling rate", () => {
    render(<ImageFailureTracker />);

    // random() returns 0.5, which is > REPORT_SAMPLE_RATE (0.2) — should skip
    vi.mocked(Math.random).mockReturnValue(0.5);

    act(() => {
      fireImageError(uniqueImageUrl());
    });

    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
