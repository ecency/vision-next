import { afterEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("axios", () => ({
  default: { create: () => ({ post, get: vi.fn() }) }
}));

import { chunkText, getTranslation, stripEmojis } from "@/api/translation";

describe("chunkText", () => {
  it("returns the whole text when within the limit", () => {
    expect(chunkText("short text", 100)).toEqual(["short text"]);
  });

  it("splits long spaced text into chunks that respect the limit", () => {
    const text = Array.from({ length: 50 }, (_, i) => `word${i}`).join(" ");
    const chunks = chunkText(text, 30);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(30));
    expect(chunks.join(" ")).toBe(text);
  });

  it("hard-splits a space-less run longer than the limit (CJK)", () => {
    // A 250-char CJK paragraph with no spaces must not become one over-limit chunk.
    const cjk = "中".repeat(250);
    const chunks = chunkText(cjk, 100);
    expect(chunks.length).toBe(3);
    chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(100));
    expect(chunks.join("")).toBe(cjk);
  });
});

describe("stripEmojis", () => {
  it("removes trailing emoji and returns them separately", () => {
    // Regression: 'Mi sobrina posando 😂❤️' was detected as Portuguese because
    // of the emoji, leaving 'Mi sobrina' untranslated.
    const { clean, emojis } = stripEmojis("Mi sobrina posando 😂❤️");
    expect(clean).toBe("Mi sobrina posando");
    expect(emojis).toBe("😂❤️");
  });

  it("removes emoji interspersed in the text and collapses whitespace", () => {
    const { clean, emojis } = stripEmojis("Hola 👋 amigos 😊");
    expect(clean).toBe("Hola amigos");
    expect(emojis).toBe("👋😊");
  });

  it("keeps ZWJ emoji sequences intact when re-joined", () => {
    const { clean, emojis } = stripEmojis("family 👨‍👩‍👧 photo");
    expect(clean).toBe("family photo");
    expect(emojis).toBe("👨‍👩‍👧");
  });

  it("keeps skin-tone modifiers attached to their base emoji", () => {
    const { clean, emojis } = stripEmojis("thumbs 👍🏽 up");
    expect(clean).toBe("thumbs up");
    expect(emojis).toBe("👍🏽");
  });

  it("removes keycap sequences as a whole (base + combiners)", () => {
    const { clean, emojis } = stripEmojis("Top 1️⃣ choice");
    expect(clean).toBe("Top choice");
    expect(emojis).toBe("1️⃣");
  });

  it("removes base+variation-selector symbols below U+2300 as a unit", () => {
    expect(stripEmojis("Copyright ©️ 2024")).toEqual({
      clean: "Copyright 2024",
      emojis: "©️"
    });
    expect(stripEmojis("Play ▶️ now")).toEqual({ clean: "Play now", emojis: "▶️" });
  });

  it("returns the text unchanged when there are no emoji", () => {
    const { clean, emojis } = stripEmojis("Hello world");
    expect(clean).toBe("Hello world");
    expect(emojis).toBe("");
  });

  it("preserves newlines and spacing when there are no emoji", () => {
    const { clean, emojis } = stripEmojis("line1\n\nline2");
    expect(clean).toBe("line1\n\nline2");
    expect(emojis).toBe("");
  });

  it("preserves line breaks when emoji are removed", () => {
    const { clean, emojis } = stripEmojis("para1\n\npara2 🎉");
    expect(clean).toBe("para1\n\npara2");
    expect(emojis).toBe("🎉");
  });

  it("does not strip plain text symbols (arrows, #, *, digits)", () => {
    const input = "go left ← or right → item #1 *bold* 2 cats";
    expect(stripEmojis(input)).toEqual({ clean: input, emojis: "" });
  });

  it("yields empty clean text for emoji-only input", () => {
    const { clean, emojis } = stripEmojis("😂❤️🎉");
    expect(clean).toBe("");
    expect(emojis).toBe("😂❤️🎉");
  });
});

describe("getTranslation", () => {
  afterEach(() => post.mockReset());

  it("translates the cleaned text and re-attaches the emoji", async () => {
    post.mockResolvedValue({ data: { translatedText: "My niece posing" } });

    const result = await getTranslation("Mi sobrina posando 😂❤️", "auto", "en");

    expect(post).toHaveBeenCalledWith(
      "/translate",
      expect.objectContaining({ q: "Mi sobrina posando", source: "auto", target: "en" })
    );
    expect(result.translatedText).toBe("My niece posing 😂❤️");
  });

  it("skips the request for emoji-only input and returns it unchanged", async () => {
    const result = await getTranslation("😂❤️", "auto", "en");

    expect(post).not.toHaveBeenCalled();
    expect(result.translatedText).toBe("😂❤️");
  });
});
