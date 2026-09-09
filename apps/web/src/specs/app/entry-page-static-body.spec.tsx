import React from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderPostBody } from "@ecency/render-helper";
import * as Sentry from "@sentry/nextjs";
import { EntryPageStaticBody } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-static-body";
import { mockEntry } from "@/specs/test-utils";

vi.mock("@ecency/render-helper", async () => ({
  ...(await vi.importActual<typeof import("@ecency/render-helper")>("@ecency/render-helper")),
  renderPostBody: vi.fn()
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn()
}));

vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// The entry route has no Suspense boundary above the post body, so a throw
// during its SSR render is a full-page 500 (see page.tsx). This is the only
// containment left for hostile markdown on the server side.
describe("EntryPageStaticBody", () => {
  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear();
  });

  it("renders the markdown output on the happy path", () => {
    vi.mocked(renderPostBody).mockReturnValue("<p>hello <b>world</b></p>");
    const { container } = render(
      <EntryPageStaticBody entry={mockEntry({ body: "hello **world**" })} />
    );
    const body = container.querySelector("#post-body");
    expect(body?.tagName).toBe("DIV");
    expect(body?.innerHTML).toBe("<p>hello <b>world</b></p>");
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("survives a real body that breaks the sanitizer (out-of-range entity)", async () => {
    const actual = await vi.importActual<typeof import("@ecency/render-helper")>(
      "@ecency/render-helper"
    );
    vi.mocked(renderPostBody).mockImplementation(actual.renderPostBody);
    // One line any account can broadcast: RangeError: Invalid code point 1114112
    // from the last-resort sanitizeHtml pass inside renderPostBody.
    const body = `<div title="&#1114112;">boom</span>`;
    expect(() => actual.renderPostBody(body, false, false, "ecency.com")).toThrow(RangeError);
    const { container } = render(<EntryPageStaticBody entry={mockEntry({ body })} />);
    expect(container.querySelector("#post-body")?.tagName).toBe("PRE");
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("falls back to the escaped raw body and reports when the renderer throws", () => {
    vi.mocked(renderPostBody).mockImplementation(() => {
      throw new Error("hostile markdown");
    });
    const entry = mockEntry({ author: "alice", permlink: "boom", body: "<script>x</script> raw" });
    const { container } = render(<EntryPageStaticBody entry={entry} />);
    const body = container.querySelector("#post-body");
    expect(body?.tagName).toBe("PRE");
    expect(body?.textContent).toBe("<script>x</script> raw");
    expect(body?.querySelector("script")).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: expect.objectContaining({ author: "alice", permlink: "boom" }) })
    );
  });
});
