import { describe, expect, it } from "vitest";
import { postBodySummary } from "@ecency/render-helper";
import { ENTRY_SUMMARY_LENGTH, entrySummary } from "@/core/entries/entry-summary";
import type { Entry } from "@/entities";
import { mockEntry } from "@/specs/test-utils";

// render-helper memoizes body summaries per author/permlink/update, so each
// fixture needs its own permlink or one test reads another's cached summary.
let seq = 0;

function entry(overrides: Partial<Entry> = {}): Entry {
  return mockEntry({ permlink: `summary-fixture-${++seq}`, ...overrides });
}

// What a client that copies the whole post into `description` publishes.
const MARKDOWN_BODY = [
  "https://youtu.be/abc123",
  "",
  "![Image](https://images.hive.blog/cover.png)",
  "",
  "# Dev Update",
  "",
  "## Inbox Rendering Fix",
  "",
  "* Fixed an issue where text lines could appear in the **wrong order** on the Inbox page.",
  "* Added **preLinkMentions** processing to **hiveBodyRenderer.ts**.",
  "",
  "| | |",
  "|---|---|",
  "| [![](https://images.hive.blog/a.png)](https://example.com/) | [Docs](https://example.com/docs) |"
]
  .join("\n")
  .repeat(6);

describe("entrySummary", () => {
  it("keeps a short author-written description, trimmed", () => {
    const e = entry({ json_metadata: { description: "  Author summary  " } });
    expect(entrySummary(e)).toBe("Author summary");
  });

  it("strips markdown from a description and caps it at the summary length", () => {
    const e = entry({ json_metadata: { description: MARKDOWN_BODY } });
    const summary = entrySummary(e);

    // postBodySummary's joiner may overshoot the cap by one word, never by more.
    expect(summary.length).toBeGreaterThan(0);
    expect(summary.length).toBeLessThanOrEqual(ENTRY_SUMMARY_LENGTH + 10);
    expect(summary).not.toContain("#");
    expect(summary).not.toContain("**");
    expect(summary).not.toContain("![");
    expect(summary).not.toContain("http");
    expect(summary).not.toContain("|");
    expect(summary.startsWith("Dev Update Inbox Rendering Fix")).toBe(true);
  });

  it("honours a caller-supplied length", () => {
    const e = entry({ json_metadata: { description: MARKDOWN_BODY } });
    expect(entrySummary(e, 40).length).toBeLessThanOrEqual(50);
  });

  it("ignores a non-string description and summarises the body", () => {
    const e = entry({ json_metadata: { description: { en: "nope" } as unknown as string } });
    expect(entrySummary(e)).toBe(postBodySummary(e, ENTRY_SUMMARY_LENGTH).trim());
  });

  it("falls back to the body when the description is blank", () => {
    const e = entry({ json_metadata: { description: "   " } });
    expect(entrySummary(e)).toBe(postBodySummary(e, ENTRY_SUMMARY_LENGTH).trim());
  });

  it("falls back to the body when the description strips to nothing", () => {
    const e = entry({ json_metadata: { description: "![](https://images.hive.blog/x.png)" } });
    expect(entrySummary(e)).toBe(postBodySummary(e, ENTRY_SUMMARY_LENGTH).trim());
  });

  it("returns an empty string when neither source has text", () => {
    const e = entry({ body: "![](https://images.hive.blog/x.png)", json_metadata: {} });
    expect(entrySummary(e)).toBe("");
  });
});
