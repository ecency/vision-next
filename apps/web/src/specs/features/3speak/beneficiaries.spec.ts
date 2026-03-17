import { BeneficiaryRoute } from "@/entities";
import {
  hasThreeSpeakEmbed,
  enforceThreeSpeakBeneficiary,
  isThreeSpeakBeneficiary
} from "@/api/threespeak-embed/beneficiary";

describe("3Speak embed beneficiaries", () => {
  describe("hasThreeSpeakEmbed", () => {
    it("detects a 3Speak embed URL with ?v= format", () => {
      const body = 'Check out my video: https://play.3speak.tv/embed?v=user/abcd1234';
      expect(hasThreeSpeakEmbed(body)).toBe(true);
    });

    it("detects embed URLs with subdomains", () => {
      const body = '<iframe src="https://cdn.3speak.tv/embed?v=user/abc"></iframe>';
      expect(hasThreeSpeakEmbed(body)).toBe(true);
    });

    it("detects embed URLs with path format", () => {
      const body = "https://play.3speak.tv/embed/user/abc123";
      expect(hasThreeSpeakEmbed(body)).toBe(true);
    });

    it("does NOT match plain text mentions of 3speak.tv/embed without URL", () => {
      const body = "check out 3speak.tv/embed for more info";
      expect(hasThreeSpeakEmbed(body)).toBe(false);
    });

    it("does NOT match partial URLs without protocol", () => {
      const body = "visit play.3speak.tv/embed?v=user/abc";
      expect(hasThreeSpeakEmbed(body)).toBe(false);
    });

    it("returns false for empty body", () => {
      expect(hasThreeSpeakEmbed("")).toBe(false);
    });

    it("returns false for unrelated content", () => {
      expect(hasThreeSpeakEmbed("Hello world, this is a blog post")).toBe(false);
    });
  });

  describe("enforceThreeSpeakBeneficiary", () => {
    const bodyWithEmbed = 'Video: https://play.3speak.tv/embed?v=user/abcd1234';
    const bodyWithoutEmbed = "Just a regular post";

    it("returns original list when no embed is detected", () => {
      const list: BeneficiaryRoute[] = [{ account: "alice", weight: 500 }];
      const result = enforceThreeSpeakBeneficiary(list, bodyWithoutEmbed);
      expect(result).toBe(list); // Same reference
    });

    it("appends threespeakfund when embed detected and not in list", () => {
      const list: BeneficiaryRoute[] = [{ account: "alice", weight: 500 }];
      const result = enforceThreeSpeakBeneficiary(list, bodyWithEmbed);
      expect(result).toEqual([
        { account: "alice", weight: 500 },
        { account: "threespeakfund", weight: 1100 }
      ]);
    });

    it("normalizes weight when threespeakfund exists with wrong weight", () => {
      const list: BeneficiaryRoute[] = [
        { account: "alice", weight: 500 },
        { account: "threespeakfund", weight: 500 }
      ];
      const result = enforceThreeSpeakBeneficiary(list, bodyWithEmbed);
      expect(result).toEqual([
        { account: "alice", weight: 500 },
        { account: "threespeakfund", weight: 1100 }
      ]);
    });

    it("returns original list when threespeakfund already has correct weight", () => {
      const list: BeneficiaryRoute[] = [
        { account: "alice", weight: 500 },
        { account: "threespeakfund", weight: 1100 }
      ];
      const result = enforceThreeSpeakBeneficiary(list, bodyWithEmbed);
      expect(result).toBe(list); // Same reference
    });

    it("works with empty beneficiary list", () => {
      const result = enforceThreeSpeakBeneficiary([], bodyWithEmbed);
      expect(result).toEqual([{ account: "threespeakfund", weight: 1100 }]);
    });
  });

  describe("isThreeSpeakBeneficiary", () => {
    it("returns true for threespeakfund", () => {
      expect(isThreeSpeakBeneficiary("threespeakfund")).toBe(true);
    });

    it("returns false for other accounts", () => {
      expect(isThreeSpeakBeneficiary("alice")).toBe(false);
    });
  });
});
