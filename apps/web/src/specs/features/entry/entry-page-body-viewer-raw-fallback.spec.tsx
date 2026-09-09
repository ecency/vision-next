import React from "react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EntryPageBodyViewer } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-body-viewer";
import { mockEntry } from "@/specs/test-utils";

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
// (EntryPageStaticBody -> EntryPageRawBody). Escaped source text has nothing to
// enhance, so the post enhancements must leave it alone. The observable
// enhancement used here is image zoom: it wraps every body image in a
// .markdown-image-container.
describe("EntryPageBodyViewer on the raw-body fallback", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function mountBody(tag: "div" | "pre") {
    host.innerHTML = `<${tag} id="post-body" class="entry-body markdown-view"><img src="https://images.ecency.com/p/x.png" alt=""></${tag}>`;
    return render(<EntryPageBodyViewer entry={mockEntry({ body: "body" })} />);
  }

  // The effect waits 100 ms, then lazy-loads the enhancer chunk and medium-zoom,
  // so the positive case polls. It runs first, which also warms the chunk for
  // the negative case below.
  it("enhances the images of a rendered <div id=post-body>", async () => {
    const { unmount } = await mountBody("div");
    await waitFor(
      () => expect(host.querySelector(".markdown-image-container > img")).not.toBeNull(),
      { timeout: 5000 }
    );
    unmount();
  });

  it("leaves the escaped <pre id=post-body> fallback untouched", async () => {
    const { unmount } = await mountBody("pre");
    // Well past the 100 ms effect delay; the enhancer chunk is already loaded.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(host.querySelector("img")).not.toBeNull();
    expect(host.querySelector(".markdown-image-container")).toBeNull();
    unmount();
  });
});
