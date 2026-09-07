import { describe, expect, it } from "vitest";
import { postBodySummary } from "@ecency/render-helper";
import { ENTRY_SUMMARY_LENGTH, entrySummary, summarizeText } from "@/core/entries/entry-summary";
import { slimEntry } from "@/core/entries/slim-entry";
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

const CJK = "這是一段完全沒有空格的中文描述文字".repeat(20);

describe("summarizeText", () => {
  it("keeps a bounded excerpt of text without spaces instead of dropping it", () => {
    expect(postBodySummary(CJK, ENTRY_SUMMARY_LENGTH)).toBe(""); // the helper's own behaviour
    expect(summarizeText(CJK)).toBe(CJK.slice(0, ENTRY_SUMMARY_LENGTH));
  });

  it("cuts space-less text by code point, never through a surrogate pair", () => {
    const text = summarizeText("🎉".repeat(400));
    expect(Array.from(text)).toHaveLength(ENTRY_SUMMARY_LENGTH);
    expect(text).toBe("🎉".repeat(ENTRY_SUMMARY_LENGTH));
  });

  it("returns an empty string for text that strips to nothing", () => {
    expect(summarizeText("![](https://images.hive.blog/x.png)")).toBe("");
  });
});

describe("entrySummary", () => {
  it("keeps an excerpt of a description without spaces", () => {
    const e = entry({ json_metadata: { description: CJK } });
    expect(entrySummary(e)).toBe(CJK.slice(0, ENTRY_SUMMARY_LENGTH));
  });

  it("keeps that excerpt even when the body is image-only", () => {
    const e = entry({
      body: "![](https://images.hive.blog/x.png)",
      json_metadata: { description: CJK }
    });
    expect(entrySummary(e)).toBe(CJK.slice(0, ENTRY_SUMMARY_LENGTH));
  });

  it("returns a slim row's derived description as is, without parsing it again", () => {
    const slim = {
      ...entry({ body: "" }),
      slim: { ext_link: false },
      json_metadata: { description: "*literal asterisks* and <div>kept</div>" }
    };
    expect(entrySummary(slim)).toBe("*literal asterisks* and <div>kept</div>");
  });

  it("shows on the card exactly what the slimmer derived (slimmer-to-card path)", () => {
    const e = entry({
      body: "\\*literal asterisks\\* and &lt;div&gt;encoded&lt;/div&gt; with more words"
    });
    // Warm render-helper's per-entry cache with the full entry first, as SSR does.
    postBodySummary(e, ENTRY_SUMMARY_LENGTH);
    const slim = slimEntry(e);

    expect(slim.json_metadata?.description).toBe(
      "*literal asterisks* and <div>encoded</div> with more words"
    );
    expect(entrySummary(slim)).toBe(slim.json_metadata?.description);
  });

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
