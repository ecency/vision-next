import { describe, it, expect } from "vitest";
import { decideExtensionLoginAction } from "@/features/shared/login/extension-login-action";
import type { DetectedExtension } from "@/utils/hive-extensions";

const ext = (id: DetectedExtension["id"]): DetectedExtension => ({ id, name: id, icon: "" });

describe("decideExtensionLoginAction", () => {
  it("guides to install when nothing is detected and Keychain-mobile is unavailable", () => {
    expect(decideExtensionLoginAction([], "alice", false)).toEqual({ kind: "install" });
  });

  it("asks for a username first when an extension is present but the field is empty", () => {
    expect(decideExtensionLoginAction([ext("keychain")], "", false)).toEqual({ kind: "needUsername" });
  });

  it("always shows the picker with 2+ extensions (regression: must NOT auto-route to one)", () => {
    expect(
      decideExtensionLoginAction([ext("keychain"), ext("hive-keeper")], "alice", false)
    ).toEqual({ kind: "picker" });
  });

  it("signs directly with the single detected extension", () => {
    expect(decideExtensionLoginAction([ext("hive-keeper")], "alice", false)).toEqual({
      kind: "login",
      extId: "hive-keeper"
    });
  });

  it("treats Keychain-mobile (nothing detected) as a direct login", () => {
    expect(decideExtensionLoginAction([], "alice", true)).toEqual({ kind: "login", extId: undefined });
  });
});
