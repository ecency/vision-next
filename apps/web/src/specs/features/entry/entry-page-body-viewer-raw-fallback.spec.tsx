import React from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EntryPageBodyViewer } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-body-viewer";
import { mockEntry } from "@/specs/test-utils";

const setupPostEnhancements = vi.fn(() => () => {});

vi.mock("@/features/post-renderer/components/utils/setupPostEnhancements", () => ({
  setupPostEnhancements: (...args: unknown[]) => setupPostEnhancements(...args)
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null
}));

vi.mock("@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/selection-popover", () => ({
  SelectionPopover: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}));

vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// The server renders #post-body as a <pre> when the markdown renderer throws
// (EntryPageStaticBody -> EntryPageRawBody). There is nothing to enhance in
// escaped source text, so the effect must not run against it.
describe("EntryPageBodyViewer on the raw-body fallback", () => {
  let host: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    setupPostEnhancements.mockClear();
    host = document.createElement("div");
    document.body.appendChild(host);
  });

  afterEach(() => {
    vi.useRealTimers();
    host.remove();
  });

  async function mount(tag: "div" | "pre") {
    host.innerHTML = `<${tag} id="post-body">body</${tag}>`;
    const utils = render(<EntryPageBodyViewer entry={mockEntry({ body: "body" })} />);
    await vi.advanceTimersByTimeAsync(200);
    // The enhancer chunk is imported lazily; flush the dynamic import too.
    await vi.advanceTimersByTimeAsync(0);
    return utils;
  }

  it("enhances a rendered <div id=post-body>", async () => {
    const { unmount } = await mount("div");
    expect(setupPostEnhancements).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("skips the escaped <pre id=post-body> fallback", async () => {
    const { unmount } = await mount("pre");
    expect(setupPostEnhancements).not.toHaveBeenCalled();
    unmount();
  });
});
