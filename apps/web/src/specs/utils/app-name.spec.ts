import { appName } from "../../utils/app-name";

describe("App name", () => {
  it("(1) should return empty string if argument given is null or undefined or empty string", () => {
    expect(appName("")).toBe("");

    expect(appName(undefined)).toBe("");

    expect(appName(null)).toBe("");
  });

  it("(2) should return app name if string", () => {
    expect(appName("esteem")).toBe("esteem");
  });

  it("(3) should return app name if object", () => {
    expect(appName({ name: "esteem-surfer" })).toBe("esteem-surfer");
  });

  it("(4) ignores a non-string name (untrusted json_metadata.app on the SSR path)", () => {
    expect(appName({ name: null })).toBe("");
    expect(appName({ name: 123 })).toBe("");
    expect(appName({ name: { nested: true } })).toBe("");
  });
});
