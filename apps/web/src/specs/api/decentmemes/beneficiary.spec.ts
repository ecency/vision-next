import { BeneficiaryRoute } from "@/entities";
import {
  aggregateMemeBeneficiaries,
  collectPresentMemeAttribution,
  DECENTMEMES_COMMENT_MAX_WEIGHT,
  DECENTMEMES_POST_MAX_WEIGHT,
  enforceDecentMemesBeneficiary,
  ensureDecentMemesTag,
  HIVE_MAX_BENEFICIARIES,
  HIVE_MAX_TOTAL_WEIGHT
} from "@/api/decentmemes";

const totalWeight = (list: BeneficiaryRoute[]) => list.reduce((s, b) => s + b.weight, 0);

describe("DecentMemes beneficiaries", () => {
  describe("aggregateMemeBeneficiaries", () => {
    it("strips the role field and keeps account + weight", () => {
      const result = aggregateMemeBeneficiaries([{ account: "alice", weight: 300 } as any]);
      expect(result).toEqual([{ account: "alice", weight: 300 }]);
    });

    it("sums duplicate accounts", () => {
      const result = aggregateMemeBeneficiaries([
        { account: "alice", weight: 300 },
        { account: "alice", weight: 100 }
      ]);
      expect(result).toEqual([{ account: "alice", weight: 400 }]);
    });

    it("drops invalid entries (no account, zero/negative/NaN weight)", () => {
      const result = aggregateMemeBeneficiaries([
        { account: "", weight: 300 },
        { account: "bob", weight: 0 },
        { account: "carol", weight: -5 },
        { account: "dave", weight: Number.NaN },
        { account: "erin", weight: 100 }
      ]);
      expect(result).toEqual([{ account: "erin", weight: 100 }]);
    });

    it("drops entries with malformed Hive account names", () => {
      const result = aggregateMemeBeneficiaries([
        { account: "UPPERCASE", weight: 100 },
        { account: "1numericstart", weight: 100 },
        { account: "x", weight: 100 },
        { account: "user@invalid", weight: 100 },
        { account: "good.name", weight: 100 }
      ]);
      expect(result).toEqual([{ account: "good.name", weight: 100 }]);
    });
  });

  describe("enforceDecentMemesBeneficiary", () => {
    it("appends meme beneficiaries to an empty user list", () => {
      const { beneficiaries, dropped } = enforceDecentMemesBeneficiary(
        [],
        [
          { account: "alice", weight: 300, role: "creator" } as any,
          { account: "ecency", weight: 100, role: "frontend" } as any
        ]
      );
      expect(beneficiaries).toEqual([
        { account: "alice", weight: 300 },
        { account: "ecency", weight: 100 }
      ]);
      expect(dropped).toBe(false);
    });

    it("never mutates or drops the user's own beneficiaries", () => {
      const existing: BeneficiaryRoute[] = [{ account: "bob", weight: 5000 }];
      const { beneficiaries } = enforceDecentMemesBeneficiary(existing, [
        { account: "alice", weight: 300 }
      ]);
      expect(beneficiaries).toContainEqual({ account: "bob", weight: 5000 });
      expect(beneficiaries).toContainEqual({ account: "alice", weight: 300 });
    });

    it("excludes a meme beneficiary that equals the post author", () => {
      const { beneficiaries } = enforceDecentMemesBeneficiary(
        [],
        [
          { account: "author", weight: 300 },
          { account: "alice", weight: 200 }
        ],
        "author"
      );
      expect(beneficiaries.some((b) => b.account === "author")).toBe(false);
      expect(beneficiaries).toContainEqual({ account: "alice", weight: 200 });
    });

    it("caps the meme contribution at the 10% post maximum", () => {
      const { beneficiaries, dropped } = enforceDecentMemesBeneficiary(
        [],
        [{ account: "alice", weight: 9000 }]
      );
      expect(totalWeight(beneficiaries)).toBeLessThanOrEqual(DECENTMEMES_POST_MAX_WEIGHT);
      expect(dropped).toBe(true);
    });

    it("caps at the 30% comment maximum when given the comment limit", () => {
      const { beneficiaries, dropped } = enforceDecentMemesBeneficiary(
        [],
        [
          { account: "alice", weight: 500 },
          { account: "bob", weight: 1000 },
          { account: "ecency", weight: 100 }
        ],
        undefined,
        DECENTMEMES_COMMENT_MAX_WEIGHT
      );
      // 1600 total is under the 3000 comment cap, so nothing is scaled/dropped.
      expect(totalWeight(beneficiaries)).toBe(1600);
      expect(dropped).toBe(false);
    });

    it("scales a comment meme set down to the 30% cap when it exceeds it", () => {
      const { beneficiaries, dropped } = enforceDecentMemesBeneficiary(
        [],
        [{ account: "alice", weight: 9000 }],
        undefined,
        DECENTMEMES_COMMENT_MAX_WEIGHT
      );
      expect(totalWeight(beneficiaries)).toBeLessThanOrEqual(DECENTMEMES_COMMENT_MAX_WEIGHT);
      expect(dropped).toBe(true);
    });

    it("scales meme beneficiaries down to fit the remaining weight headroom", () => {
      // User already allocated 99.5% -> only 50 bp headroom for memes.
      const existing: BeneficiaryRoute[] = [{ account: "bob", weight: 9950 }];
      const { beneficiaries, dropped } = enforceDecentMemesBeneficiary(existing, [
        { account: "alice", weight: 300 }
      ]);
      expect(totalWeight(beneficiaries)).toBeLessThanOrEqual(HIVE_MAX_TOTAL_WEIGHT);
      expect(dropped).toBe(true);
    });

    it("drops meme beneficiaries entirely when there is no weight headroom", () => {
      const existing: BeneficiaryRoute[] = [{ account: "bob", weight: 10000 }];
      const { beneficiaries, dropped } = enforceDecentMemesBeneficiary(existing, [
        { account: "alice", weight: 300 }
      ]);
      expect(beneficiaries).toEqual([{ account: "bob", weight: 10000 }]);
      expect(dropped).toBe(true);
    });

    it("respects the 8-slot limit by dropping the lowest-weight new accounts", () => {
      const existing: BeneficiaryRoute[] = Array.from({ length: 7 }, (_, i) => ({
        account: `user${i}`,
        weight: 100
      }));
      const { beneficiaries, dropped } = enforceDecentMemesBeneficiary(existing, [
        { account: "low", weight: 50 },
        { account: "high", weight: 200 }
      ]);
      expect(beneficiaries.length).toBe(HIVE_MAX_BENEFICIARIES);
      expect(beneficiaries.some((b) => b.account === "high")).toBe(true);
      expect(beneficiaries.some((b) => b.account === "low")).toBe(false);
      expect(dropped).toBe(true);
    });

    it("bumps an existing account's weight instead of consuming a new slot", () => {
      const existing: BeneficiaryRoute[] = [{ account: "ecency", weight: 200 }];
      const { beneficiaries, dropped } = enforceDecentMemesBeneficiary(existing, [
        { account: "ecency", weight: 100, role: "frontend" } as any
      ]);
      expect(beneficiaries).toEqual([{ account: "ecency", weight: 300 }]);
      expect(dropped).toBe(false);
    });

    it("merges the meme frontend row into an existing Support Ecency row (never a duplicate)", () => {
      // The Support Ecency preference injects {account: "ecency", weight: 500}
      // before publish; the DecentMemes widget also routes 1% to the "ecency"
      // frontend account. Hive rejects duplicate beneficiary accounts, so the
      // merge must always produce a single combined row.
      const existing: BeneficiaryRoute[] = [
        { account: "ecency", weight: 500 },
        { account: "someuser", weight: 100 }
      ];
      const { beneficiaries, dropped } = enforceDecentMemesBeneficiary(existing, [
        { account: "memecreator", weight: 200, role: "creator" } as any,
        { account: "ecency", weight: 100, role: "frontend" } as any
      ]);
      const ecencyRows = beneficiaries.filter((b) => b.account === "ecency");
      expect(ecencyRows).toEqual([{ account: "ecency", weight: 600 }]);
      expect(beneficiaries).toContainEqual({ account: "memecreator", weight: 200 });
      expect(beneficiaries).toContainEqual({ account: "someuser", weight: 100 });
      expect(dropped).toBe(false);
    });

    it("produces a list that always satisfies Hive limits", () => {
      const existing: BeneficiaryRoute[] = [
        { account: "a", weight: 4000 },
        { account: "b", weight: 4000 }
      ];
      const { beneficiaries } = enforceDecentMemesBeneficiary(existing, [
        { account: "c", weight: 300 },
        { account: "d", weight: 300 },
        { account: "e", weight: 300 }
      ]);
      expect(beneficiaries.length).toBeLessThanOrEqual(HIVE_MAX_BENEFICIARIES);
      expect(totalWeight(beneficiaries)).toBeLessThanOrEqual(HIVE_MAX_TOTAL_WEIGHT);
    });
  });

  describe("ensureDecentMemesTag", () => {
    it("appends the decentmemes tag without reordering existing tags", () => {
      expect(ensureDecentMemesTag(["photography", "art"])).toEqual([
        "photography",
        "art",
        "decentmemes"
      ]);
    });

    it("does not duplicate the tag", () => {
      const tags = ["photography", "decentmemes"];
      expect(ensureDecentMemesTag(tags)).toBe(tags);
    });

    it("does not exceed the 10-tag limit", () => {
      const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`);
      expect(ensureDecentMemesTag(tags)).toBe(tags);
      expect(ensureDecentMemesTag(tags)).not.toContain("decentmemes");
    });
  });

  describe("collectPresentMemeAttribution", () => {
    const entries = [
      {
        templateId: "t1",
        imageUrl: "https://i.ecency.com/a.png",
        beneficiaries: [{ account: "alice", weight: 300 }]
      },
      {
        templateId: "t2",
        imageUrl: "https://i.ecency.com/b.png",
        beneficiaries: [{ account: "bob", weight: 200 }]
      }
    ];

    it("keeps only memes whose image is still in the body", () => {
      const body = "hello ![meme](https://i.ecency.com/a.png) world";
      const { templateIds, beneficiaries } = collectPresentMemeAttribution(entries, body);
      expect(templateIds).toEqual(["t1"]);
      expect(beneficiaries).toEqual([{ account: "alice", weight: 300 }]);
    });

    it("returns empty attribution when no meme image remains", () => {
      const { templateIds, beneficiaries } = collectPresentMemeAttribution(
        entries,
        "no images here"
      );
      expect(templateIds).toEqual([]);
      expect(beneficiaries).toEqual([]);
    });

    it("aggregates beneficiaries and dedupes template ids across present memes", () => {
      const body = "![](https://i.ecency.com/a.png) ![](https://i.ecency.com/b.png)";
      const withDup = [
        ...entries,
        {
          templateId: "t1",
          imageUrl: "https://i.ecency.com/a.png",
          beneficiaries: [{ account: "alice", weight: 100 }]
        }
      ];
      const { templateIds, beneficiaries } = collectPresentMemeAttribution(withDup, body);
      expect(templateIds.sort()).toEqual(["t1", "t2"]);
      expect(beneficiaries).toContainEqual({ account: "alice", weight: 400 });
      expect(beneficiaries).toContainEqual({ account: "bob", weight: 200 });
    });
  });
});
