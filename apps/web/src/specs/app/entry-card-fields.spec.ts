import { describe, it, expect, vi } from "vitest";

// The global @/utils mock only exposes random/getAccessToken; restore the real
// module so buildEntryCardFields gets the real `truncate` (render-helper is not
// globally mocked, so postBodySummary/catchPostImage are already real).
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<any>("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

import { buildEntryCardFields } from "@/app/(dynamicPages)/entry/_helpers/entry-card-fields";
import { truncate } from "@/utils";
import { postBodySummary, catchPostImage } from "@ecency/render-helper";

function entry(overrides: Record<string, unknown> = {}) {
  return {
    author: "alice",
    permlink: "my-post",
    title: "Hello World",
    body: "This is the body of the post with enough words to summarize nicely.",
    parent_author: "",
    json_metadata: {},
    ...overrides
  };
}

describe("buildEntryCardFields", () => {
  it("matches the inline title/summary/image rules for a post (parity lock)", () => {
    const e = entry({ json_metadata: { image: ["https://example.com/cover.png"] } });
    expect(buildEntryCardFields(e as any)).toEqual({
      isComment: false,
      title: truncate(e.title, 67),
      summary:
        (e.json_metadata as any).description || truncate(postBodySummary(e.body, 210), 160),
      image: catchPostImage(e as any, 1200, 630, "match")
    });
  });

  it("formats a comment title as '@author: <body summary>'", () => {
    const e = entry({ parent_author: "bob", title: "" });
    const fields = buildEntryCardFields(e as any);
    expect(fields.isComment).toBe(true);
    expect(fields.title).toBe(`@${e.author}: ${truncate(postBodySummary(e.body, 12), 67)}`);
  });

  it("prefers an author-set json_metadata.description for the summary", () => {
    const e = entry({ json_metadata: { description: "Author provided summary" } });
    expect(buildEntryCardFields(e as any).summary).toBe("Author provided summary");
  });

  it("passes catchPostImage through verbatim (incl. its fallback url)", () => {
    const e = entry({ body: "No inline images here at all.", json_metadata: {} });
    expect(buildEntryCardFields(e as any).image).toBe(
      catchPostImage(e as any, 1200, 630, "match")
    );
  });
});
