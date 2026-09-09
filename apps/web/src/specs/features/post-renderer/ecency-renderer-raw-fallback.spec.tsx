import React from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderPostBody } from "@ecency/render-helper";
import * as Sentry from "@sentry/nextjs";
// Imported by file path on purpose: setup-any-spec stubs the "@/features/post-renderer"
// barrel to a null component for every other spec.
import { EcencyRenderer } from "@/features/post-renderer/components/ecency-renderer";

vi.mock("@ecency/render-helper", async () => ({
  ...(await vi.importActual<typeof import("@ecency/render-helper")>("@ecency/render-helper")),
  renderPostBody: vi.fn()
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn()
}));

// The wave page (and the entry page) ship the body inside the SSR shell, with
// no Suspense boundary above this renderer to contain a throw, so a body that
// breaks the markdown pipeline would take the whole route down instead of one
// post's content. This is the containment for hostile markdown on the server.
describe("EcencyRenderer", () => {
  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear();
  });

  it("renders the markdown output on the happy path", () => {
    vi.mocked(renderPostBody).mockReturnValue("<p>hello <b>world</b></p>");
    const { container } = render(<EcencyRenderer value="hello **world**" />);
    const body = container.querySelector(".markdown-view");
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
    const value = `<div title="&#1114112;">boom</span>`;
    expect(() => actual.renderPostBody(value, false, false, "ecency.com")).toThrow(RangeError);
    const { container } = render(<EcencyRenderer value={value} />);
    expect(container.querySelector(".markdown-view pre")?.textContent).toBe(value);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("falls back to the escaped source text and reports when the renderer throws", () => {
    vi.mocked(renderPostBody).mockImplementation(() => {
      throw new Error("hostile markdown");
    });
    const value = "<script>x</script> raw";
    const { container } = render(<EcencyRenderer value={value} />);
    const body = container.querySelector(".markdown-view");
    expect(body?.querySelector("pre")?.textContent).toBe(value);
    expect(body?.querySelector("script")).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: expect.objectContaining({ where: "EcencyRenderer" }) })
    );
  });
});
