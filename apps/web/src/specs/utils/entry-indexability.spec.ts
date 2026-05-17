import { vi } from "vitest";

// postBodySummary is globally mocked (render-helper). Re-mock as identity so the
// Tier-0 content-floor length reflects the test body deterministically.
vi.mock("@ecency/render-helper", () => ({
  postBodySummary: (b: string) => b ?? ""
}));

import { Entry, EntryVote } from "@/entities";
import {
  canonicalTarget,
  isIndexable,
  isContainerTree,
  CONTAINER_ACCOUNTS,
  WAVE_MIN_BODY_CHARS
} from "../../utils/entry-indexability";

const BASE = "https://ecency.com";
const longBody = "x".repeat(WAVE_MIN_BODY_CHARS + 20);
const shortBody = "gm";

const realPostBody = "x".repeat(500); // > CONTAINER_ANCHOR_MAX_BODY (400)
const vote = (voter: string): EntryVote => ({ voter, rshares: 0 });
const votes = (n: number): EntryVote[] => Array.from({ length: n }, () => vote("v"));

const makeEntry = (o: Partial<Entry>): Entry =>
  ({
    author: "alice",
    permlink: "a-post",
    depth: 0,
    body: longBody,
    children: 0,
    active_votes: [],
    json_metadata: {},
    author_reputation: 0,
    pending_payout_value: "0.000 HBD",
    curator_payout_value: "0.000 HBD",
    ...o
  }) as unknown as Entry;

// account=null + accountFetchFailed=true => reputation gate skipped (isolates logic)
const idx = (e: Entry) => isIndexable(e, null, true);

describe("canonicalTarget", () => {
  it("normal top-level post -> self", () => {
    const e = makeEntry({ depth: 0, author: "bob", permlink: "hello" });
    expect(canonicalTarget(e, BASE)).toBe("https://ecency.com/@bob/hello");
  });

  it("explicit canonical_url wins and strips www", () => {
    const e = makeEntry({ json_metadata: { canonical_url: "https://www.foo.bar/x" } });
    expect(canonicalTarget(e, BASE)).toBe("https://foo.bar/x");
  });

  it("missing author/permlink -> null", () => {
    expect(canonicalTarget(makeEntry({ permlink: "" }), BASE)).toBeNull();
  });

  it("normal reply with root_* -> root post (any depth)", () => {
    const e = makeEntry({
      depth: 5,
      author: "alice",
      permlink: "re-x",
      parent_author: "carol",
      parent_permlink: "re-y",
      root_author: "bob",
      root_permlink: "the-post"
    });
    expect(canonicalTarget(e, BASE)).toBe("https://ecency.com/@bob/the-post");
  });

  it("normal depth-1 reply without root_* -> parent (parent is root)", () => {
    const e = makeEntry({
      depth: 1,
      author: "alice",
      permlink: "re-x",
      parent_author: "bob",
      parent_permlink: "the-post"
    });
    expect(canonicalTarget(e, BASE)).toBe("https://ecency.com/@bob/the-post");
  });

  it("normal deep reply with no resolvable root -> null", () => {
    const e = makeEntry({ depth: 4, parent_author: "x", parent_permlink: "y" });
    expect(canonicalTarget(e, BASE)).toBeNull();
  });

  it("container anchor post (depth 0, thin body) -> null", () => {
    const e = makeEntry({ author: "ecency.waves", permlink: "waves-2026", depth: 0 });
    expect(canonicalTarget(e, BASE)).toBeNull();
  });

  it("substantive depth-0 post BY a container account -> self (not anchor-suppressed)", () => {
    const e = makeEntry({
      author: "ecency.waves",
      permlink: "waves-feature-announcement",
      depth: 0,
      body: realPostBody
    });
    expect(canonicalTarget(e, BASE)).toBe(
      "https://ecency.com/@ecency.waves/waves-feature-announcement"
    );
  });

  it("wave (depth 1 under container) -> self", () => {
    const e = makeEntry({
      author: "alice",
      permlink: "my-wave",
      depth: 1,
      parent_author: "ecency.waves",
      root_author: "ecency.waves",
      root_permlink: "waves-2026"
    });
    expect(canonicalTarget(e, BASE)).toBe("https://ecency.com/@alice/my-wave");
  });

  it("bridge-fallback depth-1 wave (no root_*) -> self, NOT the anchor (P1 regression)", () => {
    const e = makeEntry({
      author: "alice",
      permlink: "my-wave",
      depth: 1,
      parent_author: "ecency.waves",
      parent_permlink: "waves-2026"
      // root_author/root_permlink absent — bridge.get_post shape
    });
    expect(canonicalTarget(e, BASE)).toBe("https://ecency.com/@alice/my-wave");
  });

  it("reply to a wave (depth 2) -> the wave (its parent)", () => {
    const e = makeEntry({
      author: "carol",
      permlink: "re-wave",
      depth: 2,
      parent_author: "alice",
      parent_permlink: "my-wave",
      root_author: "ecency.waves",
      root_permlink: "waves-2026"
    });
    expect(canonicalTarget(e, BASE)).toBe("https://ecency.com/@alice/my-wave");
  });

  it("deep wave sub-reply (depth >= 3) -> null", () => {
    const e = makeEntry({
      depth: 3,
      parent_author: "carol",
      parent_permlink: "re-wave",
      root_author: "peak.snaps",
      root_permlink: "snap-container"
    });
    expect(canonicalTarget(e, BASE)).toBeNull();
  });
});

describe("isContainerTree", () => {
  it("true when root author is a known container account", () => {
    expect(isContainerTree(makeEntry({ root_author: "leothreads", depth: 1 }))).toBe(true);
  });
  it("false for normal threads", () => {
    expect(isContainerTree(makeEntry({ root_author: "bob", depth: 1 }))).toBe(false);
  });
  it("true for bridge-fallback depth-1 wave (no root_*, parent is container)", () => {
    expect(
      isContainerTree(makeEntry({ depth: 1, parent_author: "ecency.waves" }))
    ).toBe(true);
  });
  it("all five container accounts recognised", () => {
    for (const a of ["leothreads", "ecency.waves", "peak.snaps", "liketu.moments", "hive.flow"]) {
      expect(CONTAINER_ACCOUNTS.has(a)).toBe(true);
    }
  });
});

describe("isIndexable - structure", () => {
  it("normal post indexable", () => {
    expect(idx(makeEntry({ depth: 0 }))).toBe(true);
  });
  it("normal reply with resolvable root indexable", () => {
    expect(
      idx(makeEntry({ depth: 2, root_author: "bob", root_permlink: "p" }))
    ).toBe(true);
  });
  it("normal deep reply with no root NOT indexable", () => {
    expect(idx(makeEntry({ depth: 4, parent_author: "x", parent_permlink: "y" }))).toBe(false);
  });
  it("container anchor post (thin) NOT indexable", () => {
    expect(idx(makeEntry({ author: "ecency.waves", depth: 0 }))).toBe(false);
  });
  it("substantive depth-0 post by a container account IS indexable", () => {
    expect(
      idx(makeEntry({ author: "peak.snaps", depth: 0, body: realPostBody }))
    ).toBe(true);
  });
  it("reply to wave (depth 2) indexable", () => {
    expect(
      idx(
        makeEntry({
          depth: 2,
          parent_author: "alice",
          parent_permlink: "w",
          root_author: "ecency.waves"
        })
      )
    ).toBe(true);
  });
  it("deep wave sub-reply (depth 3) NOT indexable", () => {
    expect(idx(makeEntry({ depth: 3, root_author: "ecency.waves" }))).toBe(false);
  });
});

describe("wave quality gate (depth-1 under container)", () => {
  const wave = (o: Partial<Entry>) =>
    makeEntry({
      author: "alice",
      permlink: "w",
      depth: 1,
      parent_author: "ecency.waves",
      root_author: "ecency.waves",
      root_permlink: "waves-2026",
      ...o
    });

  it("Tier0 fail: short body -> not indexable", () => {
    expect(idx(wave({ body: shortBody, children: 99 }))).toBe(false);
  });

  it("Tier1 pass via children", () => {
    expect(idx(wave({ body: longBody, children: 3 }))).toBe(true);
  });

  it("Tier1 fail: long body but no engagement", () => {
    expect(idx(wave({ body: longBody, children: 0, active_votes: [] }))).toBe(false);
  });

  it("Tier1 pass via voters + payout", () => {
    expect(
      idx(
        wave({
          children: 0,
          active_votes: votes(6),
          pending_payout_value: "0.500 HBD"
        })
      )
    ).toBe(true);
  });

  it("gaming: high payout but only 1 voter -> fail", () => {
    expect(
      idx(
        wave({
          children: 0,
          active_votes: [vote("self")],
          pending_payout_value: "50.000 HBD"
        })
      )
    ).toBe(false);
  });

  it("gaming: many voters but dust payout -> fail", () => {
    expect(
      idx(
        wave({
          children: 0,
          active_votes: votes(40),
          pending_payout_value: "0.001 HBD"
        })
      )
    ).toBe(false);
  });

  it("payout is source-agnostic (numeric payout field counts)", () => {
    expect(
      idx(
        wave({
          children: 0,
          active_votes: votes(6),
          pending_payout_value: "0.000 HBD",
          payout: 1.23
        } as Partial<Entry>)
      )
    ).toBe(true);
  });
});

describe("isIndexable - NSFW and reputation gates", () => {
  it("nsfw tag -> not indexable even for a normal post", () => {
    const e = makeEntry({ depth: 0, json_metadata: { tags: ["nsfw"] } });
    expect(idx(e)).toBe(false);
  });

  it("low-reputation author -> not indexable when account known", () => {
    const e = makeEntry({ depth: 0 });
    expect(isIndexable(e, { reputation: 0, post_count: 0 }, false)).toBe(false);
  });

  it("account fetch failed -> reputation gate skipped (not punished)", () => {
    const e = makeEntry({ depth: 0 });
    expect(isIndexable(e, null, true)).toBe(true);
  });
});
