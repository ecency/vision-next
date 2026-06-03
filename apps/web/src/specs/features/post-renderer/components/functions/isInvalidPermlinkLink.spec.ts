import { describe, it, expect } from "vitest";
import { isInvalidPermlinkLink } from "@/features/post-renderer/components/functions/is-invalid-permlink-link";

describe("isInvalidPermlinkLink", () => {
  describe("valid, enhanceable post links", () => {
    // Regression: bare "/@author/permlink" links must be treated as valid.
    // The legacy implementation read a fixed parts[3], which is undefined for
    // the bare form, so every bare post link was wrongly rejected and stopped
    // enhancing after the canonical-link migration.
    it("accepts the bare /@author/permlink form", () => {
      expect(isInvalidPermlinkLink("/@alice/my-post")).toBe(false);
    });

    it("accepts the legacy /category/@author/permlink form", () => {
      expect(isInvalidPermlinkLink("/hive-167922/@alice/my-post")).toBe(false);
    });

    it("accepts the legacy /ccc/@author/permlink form", () => {
      expect(isInvalidPermlinkLink("/ccc/@alice/my-post")).toBe(false);
    });

    it("ignores a referral query string", () => {
      expect(isInvalidPermlinkLink("/@alice/my-post?referral=bob")).toBe(false);
    });

    it("accepts a wave-style permlink", () => {
      expect(isInvalidPermlinkLink("/@alice/re-ecencywaves-abc")).toBe(false);
    });
  });

  describe("invalid links", () => {
    it("rejects profile sections (bare form)", () => {
      expect(isInvalidPermlinkLink("/@alice/posts")).toBe(true);
      expect(isInvalidPermlinkLink("/@alice/wallet")).toBe(true);
      expect(isInvalidPermlinkLink("/@alice/comments")).toBe(true);
      expect(isInvalidPermlinkLink("/@alice/followers")).toBe(true);
      expect(isInvalidPermlinkLink("/@alice/following")).toBe(true);
    });

    it("rejects image permlinks", () => {
      expect(isInvalidPermlinkLink("/@alice/photo.jpg")).toBe(true);
    });

    it("rejects a bare author with no permlink", () => {
      expect(isInvalidPermlinkLink("/@alice")).toBe(true);
    });

    it("rejects non-post paths without an author segment", () => {
      expect(isInvalidPermlinkLink("/trending")).toBe(true);
    });
  });
});
