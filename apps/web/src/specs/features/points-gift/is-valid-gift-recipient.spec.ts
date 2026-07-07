import { isValidGiftRecipient } from "@/features/points-gift/is-valid-gift-recipient";

describe("isValidGiftRecipient", () => {
  it("accepts well-formed Hive account names", () => {
    expect(isValidGiftRecipient("ecency")).toBe(true);
    expect(isValidGiftRecipient("good-karma")).toBe(true);
    expect(isValidGiftRecipient("foo.bar")).toBe(true);
    expect(isValidGiftRecipient("user123")).toBe(true);
  });

  it("tolerates a leading @ and surrounding whitespace", () => {
    expect(isValidGiftRecipient("  @ecency  ")).toBe(true);
    expect(isValidGiftRecipient("@Good-Karma")).toBe(true);
  });

  it("rejects names that are too short or too long", () => {
    expect(isValidGiftRecipient("ab")).toBe(false);
    expect(isValidGiftRecipient("a".repeat(17))).toBe(false);
    expect(isValidGiftRecipient("")).toBe(false);
  });

  it("rejects malformed segments", () => {
    expect(isValidGiftRecipient("1ecency")).toBe(false); // starts with a digit
    expect(isValidGiftRecipient("-ecency")).toBe(false); // leading hyphen
    expect(isValidGiftRecipient("ecency-")).toBe(false); // trailing hyphen
    expect(isValidGiftRecipient("good--karma")).toBe(false); // double hyphen
    expect(isValidGiftRecipient("foo.ab")).toBe(false); // short segment
    expect(isValidGiftRecipient("foo_bar")).toBe(false); // illegal char
    expect(isValidGiftRecipient("Foo Bar")).toBe(false); // space
  });

  it("rejects non-string input", () => {
    expect(isValidGiftRecipient(undefined as unknown as string)).toBe(false);
    expect(isValidGiftRecipient(null as unknown as string)).toBe(false);
  });
});
