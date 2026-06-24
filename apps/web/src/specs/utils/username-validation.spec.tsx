import { describe, expect, it } from "vitest";
// Import the file directly (not the @/utils barrel, which is globally mocked) to
// exercise the real rule. i18next is globally mocked to return keys as-is, so a
// rejected username yields its message key (truthy) and a valid one yields null.
import { getUsernameError } from "@/utils/username-validation";

describe("getUsernameError", () => {
  it("accepts valid account names", () => {
    expect(getUsernameError("ecency")).toBeNull();
    expect(getUsernameError("good-karma")).toBeNull();
    expect(getUsernameError("foo.barbaz")).toBeNull();
    expect(getUsernameError("user123")).toBeNull();
  });

  it("rejects a too-short trailing dot-segment (paid-signup incident)", () => {
    // A buyer was charged for `bitgethive.uk`: the whole name is 13 chars but the
    // `uk` segment is only 2, which the blockchain rejects (RFC 1035). The submit
    // must block this so it never reaches checkout / the backend.
    expect(getUsernameError("bitgethive.uk")).toBe("sign-up.username-min-length-error");
  });

  it("rejects empty, over-length and other invalid names", () => {
    expect(getUsernameError("")).toBe("sign-up.username-required");
    expect(getUsernameError("ab")).toBe("sign-up.username-min-length-error");
    expect(getUsernameError("a2345678901234567")).toBe("sign-up.username-max-length-error");
    expect(getUsernameError("1abc")).toBe("sign-up.username-starts-number");
    expect(getUsernameError("ab_cd")).toBe("sign-up.username-contains-symbols-error");
  });

  it("rejects dot-boundary names (empty leading/trailing segment)", () => {
    // a leading or trailing dot yields an empty segment, which the < 3 check rejects
    expect(getUsernameError("abc.")).toBe("sign-up.username-min-length-error");
    expect(getUsernameError(".abc")).toBe("sign-up.username-min-length-error");
  });
});
