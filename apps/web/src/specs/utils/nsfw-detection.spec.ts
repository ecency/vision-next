import { isNsfwEntry } from "../../utils/nsfw-detection";

describe("isNsfwEntry", () => {
  it("returns false for a typical post with safe tags", () => {
    expect(isNsfwEntry({ category: "hive-100000", json_metadata: { tags: ["photography", "travel"] } })).toBe(false);
  });

  it("returns true when nsfw is in json_metadata.tags", () => {
    expect(isNsfwEntry({ category: "hive-100000", json_metadata: { tags: ["art", "nsfw"] } })).toBe(true);
  });

  it("returns true when nsfw is the category (legacy Steemit posts)", () => {
    expect(isNsfwEntry({ category: "nsfw", json_metadata: { tags: ["misc"] } })).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(isNsfwEntry({ category: "hive-100000", json_metadata: { tags: ["  NSFW  "] } })).toBe(true);
    expect(isNsfwEntry({ category: "  NSFW  ", json_metadata: null })).toBe(true);
  });

  it("handles missing json_metadata gracefully", () => {
    expect(isNsfwEntry({ category: "blog", json_metadata: null })).toBe(false);
    expect(isNsfwEntry({ category: null, json_metadata: null })).toBe(false);
  });

  it("ignores non-string tag entries", () => {
    // Some legacy posts have malformed tags arrays; the function must not throw.
    expect(isNsfwEntry({ category: "blog", json_metadata: { tags: [null as unknown as string, 42 as unknown as string, "nsfw"] } })).toBe(true);
    expect(isNsfwEntry({ category: "blog", json_metadata: { tags: [null as unknown as string, 42 as unknown as string] } })).toBe(false);
  });

  it("returns false when tags array is missing", () => {
    expect(isNsfwEntry({ category: "blog", json_metadata: {} })).toBe(false);
  });

  it("returns true for posts in known NSFW communities", () => {
    expect(isNsfwEntry({ category: "hive-109634", json_metadata: { tags: ["art"] } })).toBe(true);
    expect(isNsfwEntry({ category: "hive-189000", json_metadata: null })).toBe(true);
    expect(isNsfwEntry({ category: "blog", json_metadata: { tags: ["hive-196493"] } })).toBe(true);
  });

  describe("title keyword detection", () => {
    it("catches legacy untagged NSFW by title keywords", () => {
      // Real top-traffic URL on ecency.com that deliberately omits the nsfw tag.
      expect(isNsfwEntry({
        category: "history",
        title: "Top 10 Most Beautiful Porn Stars (No Nude thats why no NSFW tag thanks)",
        json_metadata: { tags: ["history", "top10"] },
      })).toBe(true);
      expect(isNsfwEntry({ category: "blog", title: "10 Free Safe Porn Sites" })).toBe(true);
      expect(isNsfwEntry({ category: "blog", title: "Ten Female Masturbation Methods" })).toBe(true);
      expect(isNsfwEntry({ category: "blog", title: "Photos of Nude Living 13" })).toBe(true);
      expect(isNsfwEntry({ category: "blog", title: "Tiwa Savage leak XXX tape" })).toBe(true);
    });

    it("does not flag innocent titles containing safe stems", () => {
      expect(isNsfwEntry({ category: "blog", title: "Nuclear power plant explained" })).toBe(false);
      expect(isNsfwEntry({ category: "blog", title: "Popcorn movie night reviews" })).toBe(false);
      expect(isNsfwEntry({ category: "blog", title: "Hornets nest near my window" })).toBe(false);
      expect(isNsfwEntry({ category: "blog", title: "Capricorn personality traits" })).toBe(false);
    });

    it("ignores missing title", () => {
      expect(isNsfwEntry({ category: "blog" })).toBe(false);
      expect(isNsfwEntry({ category: "blog", title: null })).toBe(false);
    });
  });
});
