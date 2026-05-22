import { extensionErrorMessage, isUserCancellation } from "../../utils/extension-error";

describe("extensionErrorMessage", () => {
  it("falls back to the provided default when nothing is present", () => {
    expect(extensionErrorMessage({}, "Extension broadcast failed")).toBe(
      "Extension broadcast failed"
    );
  });

  it("surfaces the human-readable message", () => {
    expect(
      extensionErrorMessage({ message: "Request was canceled by the user." }, "fallback")
    ).toBe("Request was canceled by the user.");
  });

  it("surfaces a string error code", () => {
    expect(extensionErrorMessage({ error: "user_cancel" }, "fallback")).toBe("user_cancel");
  });

  it("combines message and underlying error detail", () => {
    const result = extensionErrorMessage(
      { message: "There was an error broadcasting.", error: { message: "missing required active authority" } },
      "fallback"
    );
    expect(result).toContain("There was an error broadcasting.");
    expect(result).toContain("missing required active authority");
  });

  it("does not duplicate when message equals the string error", () => {
    expect(extensionErrorMessage({ message: "boom", error: "boom" }, "fallback")).toBe("boom");
  });

  it("ignores an empty object error and uses the fallback", () => {
    expect(extensionErrorMessage({ error: {} }, "fallback")).toBe("fallback");
  });
});

describe("isUserCancellation", () => {
  it.each([
    [{ error: "user_cancel" }],
    [{ message: "Request was canceled by the user." }],
    [{ message: "User declined the transaction" }],
  ])("treats %o as a cancellation", (resp) => {
    expect(isUserCancellation(resp)).toBe(true);
  });

  it.each([
    [{}],
    [{ message: "missing required active authority" }],
    [{ error: { code: -32000, message: "insufficient resource credits" } }],
  ])("treats %o as a real failure (retryable)", (resp) => {
    expect(isUserCancellation(resp)).toBe(false);
  });
});
