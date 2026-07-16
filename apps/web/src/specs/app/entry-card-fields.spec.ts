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
    const expectedSummary =
      (e.json_metadata as any).description || truncate(postBodySummary(e.body, 210), 160);
    expect(buildEntryCardFields(e as any)).toEqual({
      isComment: false,
      title: truncate(e.title, 67),
      summary: expectedSummary,
      cardSummary: expectedSummary, // non-empty summary => identical
      image: catchPostImage(e as any, 1200, 630, "match")
    });
  });

  it("formats a comment title as '@author: <body summary>'", () => {
    const e = entry({ parent_author: "bob", title: "" });
    const fields = buildEntryCardFields(e as any);
    expect(fields.isComment).toBe(true);
    expect(fields.title).toBe(`@${e.author}: ${truncate(postBodySummary(e.body, 12), 67)}`);
  });

  it("falls back to a body-summary title for a title-less root post (e.g. D.Buzz)", () => {
    const e = entry({ title: "" });
    const fields = buildEntryCardFields(e as any);
    expect(fields.title).toBe(truncate(postBodySummary(e.body, 67), 67));
    expect(fields.title.length).toBeGreaterThan(0);
  });

  it("falls back to a byline title when a title-less post has no summarizable body", () => {
    const e = entry({ title: "", body: "![img](https://example.com/a.png)" });
    expect(buildEntryCardFields(e as any).title).toBe("Post by @alice");
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

  // Media-only posts summarize to "": `summary` (the SERP meta description)
  // stays EMPTY so Google auto-snippets from page content, while `cardSummary`
  // (og/twitter/oEmbed, which have no auto-snippet) gets a descriptive fallback.
  it("keeps summary empty but fills cardSummary for an image-only post body", () => {
    const e = entry({
      body: "![shot](https://example.com/a.jpg)",
      community_title: "Photography Lovers",
      json_metadata: { tags: ["photo", "art", "hive", "extra"] }
    });
    expect(postBodySummary(e.body as string, 210)).toBe(""); // premise: media-only => empty
    const fields = buildEntryCardFields(e as any);
    expect(fields.summary).toBe("");
    expect(fields.cardSummary).toBe(
      "A post by @alice in Photography Lovers on Ecency. Tags: photo, art, hive"
    );
  });

  it("card fallback works without community/tags and guards non-array tags", () => {
    const e = entry({ body: "![x](https://example.com/a.jpg)", json_metadata: { tags: "photo" } });
    expect(buildEntryCardFields(e as any).cardSummary).toBe("A post by @alice on Ecency");
  });

  it("uses the reply card fallback for a media-only comment", () => {
    const e = entry({ parent_author: "bob", body: "![x](https://example.com/a.jpg)" });
    expect(buildEntryCardFields(e as any).cardSummary).toBe("A reply by @alice on Ecency");
  });

  it("ignores a non-string json_metadata.description (untrusted on-chain data)", () => {
    const e = entry({ json_metadata: { description: { evil: true } } });
    const fields = buildEntryCardFields(e as any);
    expect(fields.summary).toBe(truncate(postBodySummary(e.body, 210), 160));
  });
});
