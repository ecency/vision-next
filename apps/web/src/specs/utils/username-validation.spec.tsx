import { describe, expect, it } from "vitest";
// Import the file directly (not the @/utils barrel, which is globally mocked) to
// exercise the real rule. i18next is globally mocked to return keys as-is, so a
// rejected username yields its message key (truthy) and a valid one yields null.
import {
  getUsernameError,
  hasRestrictedUsernamePrefix,
  isExchangeLikeUsername
} from "@/utils/username-validation";

describe("getUsernameError", () => {
  it("accepts valid account names", () => {
    expect(getUsernameError("ecency")).toBeNull();
    expect(getUsernameError("good-karma")).toBeNull();
    expect(getUsernameError("foo.barbaz")).toBeNull();
    expect(getUsernameError("user123")).toBeNull();
  });

  it("rejects names that resemble a known exchange account", () => {
    // chain-valid but confusable with an exchange deposit account
    expect(getUsernameError("bittrex")).toBe("sign-up.username-resembles-exchange");
    expect(getUsernameError("huobi-pro")).toBe("sign-up.username-resembles-exchange");
    expect(getUsernameError("mybittrex")).toBe("sign-up.username-resembles-exchange");
    expect(getUsernameError("coinex")).toBe("sign-up.username-resembles-exchange");
    expect(getUsernameError("bitgethive")).toBe("sign-up.username-resembles-exchange");
    expect(getUsernameError("bitget")).toBe("sign-up.username-resembles-exchange"); // brand core
  });

  it("rejects the uid + digits impersonation pattern", () => {
    expect(getUsernameError("uid12345")).toBe("sign-up.username-restricted-prefix");
    expect(getUsernameError("uid007name")).toBe("sign-up.username-restricted-prefix");
    // "uid" followed by a letter is an ordinary name, not the phishing pattern
    expect(getUsernameError("uidev")).toBeNull();
  });

  it("reports a format error before the exchange-resemblance error", () => {
    // a malformed look-alike should surface its chain-validity error first
    expect(getUsernameError("bittrex!")).toBe("sign-up.username-contains-symbols-error");
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
    expect(getUsernameError("instinto•asesino")).toBe("sign-up.username-contains-symbols-error");
    expect(getUsernameError("ab--cd")).toBe("sign-up.username-contains-double-hyphens");
  });

  it("rejects dot-boundary names (empty leading/trailing segment)", () => {
    // a leading or trailing dot yields an empty segment, which the < 3 check rejects
    expect(getUsernameError("abc.")).toBe("sign-up.username-min-length-error");
    expect(getUsernameError(".abc")).toBe("sign-up.username-min-length-error");
  });
});

describe("isExchangeLikeUsername", () => {
  it("flags exact, separator-variant and embedded exchange names", () => {
    expect(isExchangeLikeUsername("blocktrades")).toBe(true);
    expect(isExchangeLikeUsername("huobipro")).toBe(true); // separator dropped
    expect(isExchangeLikeUsername("huobi-pro")).toBe(true);
    expect(isExchangeLikeUsername("blocktrades-official")).toBe(true); // embeds brand
  });

  it("flags the leading brand portion of a deposit/exchange account", () => {
    expect(isExchangeLikeUsername("upbit")).toBe(true); // upbit-exchange
    expect(isExchangeLikeUsername("gateio")).toBe(true); // gateiodeposit
    expect(isExchangeLikeUsername("deepcrypto")).toBe(true); // deepcrypto8
  });

  it("flags single-character typos of an exchange name", () => {
    expect(isExchangeLikeUsername("bittrx")).toBe(true); // bittrex
    expect(isExchangeLikeUsername("changely")).toBe(true); // changelly
  });

  it("does not flag ordinary names that merely share a fragment", () => {
    expect(isExchangeLikeUsername("ecency")).toBe(false);
    expect(isExchangeLikeUsername("good-karma")).toBe(false);
    expect(isExchangeLikeUsername("trade")).toBe(false); // substring of blocktrades, not a prefix
    expect(isExchangeLikeUsername("deposit")).toBe(false);
    expect(isExchangeLikeUsername("blockchain")).toBe(false);
    expect(isExchangeLikeUsername("changelog")).toBe(false); // 2 edits from changelly
    // brand-core check: common-word prefixes of single-token brands stay allowed
    expect(isExchangeLikeUsername("block")).toBe(false); // prefix of blocktrades
    expect(isExchangeLikeUsername("change")).toBe(false); // prefix of changelly
  });
});

describe("hasRestrictedUsernamePrefix", () => {
  it("flags 'uid' + digits regardless of separators/case", () => {
    expect(hasRestrictedUsernamePrefix("uid12345")).toBe(true);
    expect(hasRestrictedUsernamePrefix("UID999")).toBe(true);
    expect(hasRestrictedUsernamePrefix("u.i.d.123")).toBe(true);
  });

  it("does not flag 'uid' followed by letters, or names with uid elsewhere", () => {
    expect(hasRestrictedUsernamePrefix("uidev")).toBe(false); // uid + letter
    expect(hasRestrictedUsernamePrefix("uidesign")).toBe(false);
    expect(hasRestrictedUsernamePrefix("ecency")).toBe(false);
    expect(hasRestrictedUsernamePrefix("druid")).toBe(false);
    expect(hasRestrictedUsernamePrefix("fluid")).toBe(false);
  });
});
