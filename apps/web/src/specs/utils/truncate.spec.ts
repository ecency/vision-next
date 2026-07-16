import { truncate } from "../../utils/truncate";

describe("Truncate", () => {
  it("(1) truncate", () => {
    expect(truncate("lorem ipsum dolor sit amet", 10)).toBe("lorem ipsu...");
  });

  it("(2) truncate", () => {
    expect(truncate("lore", 5)).toBe("lore");
  });

  it("never cuts through a surrogate pair (emoji at the boundary)", () => {
    // "ab" + 😀 (2 UTF-16 units) — a cut at 3 would leave a dangling high surrogate
    expect(truncate("ab\u{1F600}xyz", 3)).toBe("ab...");
    // cut cleanly after the pair keeps the emoji intact
    expect(truncate("ab\u{1F600}xyz", 4)).toBe("ab\u{1F600}...");
  });
});
