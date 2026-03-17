import { extractPermlink } from "@/api/threespeak-embed/api";

describe("extractPermlink", () => {
  it("extracts permlink from ?v=user/permlink format", () => {
    expect(extractPermlink("https://play.3speak.tv/embed?v=user/abcd1234")).toBe("abcd1234");
  });

  it("extracts permlink from @user/permlink format", () => {
    expect(extractPermlink("@user/abcd1234")).toBe("abcd1234");
  });

  it("extracts permlink from path-based URL", () => {
    expect(extractPermlink("https://play.3speak.tv/embed/user/abcd1234")).toBe("abcd1234");
  });

  it("strips query params from last segment fallback", () => {
    expect(extractPermlink("https://example.com/abcd1234?foo=bar")).toBe("abcd1234");
  });

  it("strips hash from last segment fallback", () => {
    expect(extractPermlink("https://example.com/abcd1234#section")).toBe("abcd1234");
  });

  it("returns empty string for empty input", () => {
    expect(extractPermlink("")).toBe("");
  });
});
