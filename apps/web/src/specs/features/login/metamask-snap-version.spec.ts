import { describe, expect, it } from "vitest";
import { isSnapVersionAtLeast } from "../../../features/shared/login/hooks/use-login-by-metamask";

/**
 * The Hive snap login depends on @hiveio/metamask-snap >= 1.7.0. The version gate
 * must compare numerically (not lexically), so 1.10.0 outranks 1.7.0.
 */
describe("isSnapVersionAtLeast", () => {
  it("accepts the exact minimum", () => {
    expect(isSnapVersionAtLeast("1.7.0", "1.7.0")).toBe(true);
  });

  it("accepts higher patch / minor / major", () => {
    expect(isSnapVersionAtLeast("1.7.1", "1.7.0")).toBe(true);
    expect(isSnapVersionAtLeast("1.8.0", "1.7.0")).toBe(true);
    expect(isSnapVersionAtLeast("2.0.0", "1.7.0")).toBe(true);
  });

  it("compares numerically, not lexically (1.10.0 >= 1.7.0)", () => {
    expect(isSnapVersionAtLeast("1.10.0", "1.7.0")).toBe(true);
  });

  it("rejects older versions", () => {
    expect(isSnapVersionAtLeast("1.6.9", "1.7.0")).toBe(false);
    expect(isSnapVersionAtLeast("1.6.0", "1.7.0")).toBe(false);
    expect(isSnapVersionAtLeast("0.9.9", "1.7.0")).toBe(false);
  });

  it("ignores a pre-release suffix on the patch segment", () => {
    expect(isSnapVersionAtLeast("1.7.0-flask.1", "1.7.0")).toBe(true);
  });
});
