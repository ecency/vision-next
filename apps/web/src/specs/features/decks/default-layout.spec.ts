import { describe, expect, it } from "vitest";
import { DEFAULT_COLUMNS, DEFAULT_LAYOUT } from "@/app/decks/_components/consts/default-layout.const";

describe("decks default layout", () => {
  it("opens a brand-new deck on the add-column picker with no seeded content", () => {
    // The picker ("ac") is the guided empty state; we must NOT pre-seed an
    // arbitrary feed (the old @ecency user column), which mis-taught new users
    // that Decks is a single feed page rather than a dashboard they build.
    expect(DEFAULT_COLUMNS).toHaveLength(1);
    expect(DEFAULT_COLUMNS[0].type).toBe("ac");
    expect(DEFAULT_COLUMNS.every((c) => c.type === "ac")).toBe(true);
  });

  it("wraps the empty columns in a single local default deck", () => {
    expect(DEFAULT_LAYOUT.decks).toHaveLength(1);
    expect(DEFAULT_LAYOUT.decks[0].columns).toBe(DEFAULT_COLUMNS);
    expect(DEFAULT_LAYOUT.decks[0].storageType).toBe("local");
  });
});
