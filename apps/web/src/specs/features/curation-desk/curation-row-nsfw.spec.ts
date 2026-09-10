import { describe, expect, it } from "vitest";
import { makeOverlay, makeRow } from "./curation-test-utils";
import { rowNeedsNsfwCover } from "@/features/curation-desk/curation-row-nsfw";

const withSignals = (nsfw: unknown, tags: string[] = ["photography"]) =>
  makeRow({ post_id: 1, tags, overlay: makeOverlay({ signals: { nsfw } as never }) });

describe("rowNeedsNsfwCover", () => {
  it("covers on the detector's verdict, and only on the verdict", () => {
    expect(rowNeedsNsfwCover(withSignals({ over: true, score: 0.83 }))).toBe(true);
    expect(rowNeedsNsfwCover(withSignals({ over: false, score: 0.31 }))).toBe(false);
  });

  it("treats an unknown score as unknown, never as clean or as explicit", () => {
    // A null score is "no image" or "the check could not run". Covering on it would paint
    // every image-less post; treating a high score without `over` as a verdict would move
    // the threshold off the server, where it lives so it can be retuned in one place.
    expect(rowNeedsNsfwCover(withSignals({ score: null, note: "no image" }))).toBe(false);
    expect(rowNeedsNsfwCover(withSignals({ score: 0.99 }))).toBe(false);
    expect(rowNeedsNsfwCover(withSignals(null))).toBe(false);
    expect(rowNeedsNsfwCover(makeRow({ post_id: 2, overlay: makeOverlay() }))).toBe(false);
    // a public row has no overlay at all
    expect(rowNeedsNsfwCover(makeRow({ post_id: 3, overlay: null }))).toBe(false);
  });

  it("still covers a self-declared nsfw post, whatever the detector says", () => {
    // Those posts are excluded from the working queues outright, so this arm fires on the
    // roster `excluded` lens, which is exactly where a mod goes to look at them.
    expect(rowNeedsNsfwCover(makeRow({ post_id: 4, tags: ["art", "nsfw"], overlay: null }))).toBe(true);
    expect(rowNeedsNsfwCover(makeRow({ post_id: 5, tags: ["art", "NSFW"], overlay: null }))).toBe(true);
    expect(rowNeedsNsfwCover(withSignals({ over: false, score: 0.1 }, ["nsfw"]))).toBe(true);
  });

  it("does not fall over on a row with no tags", () => {
    expect(rowNeedsNsfwCover(makeRow({ post_id: 6, tags: undefined as never, overlay: null }))).toBe(false);
  });
});
