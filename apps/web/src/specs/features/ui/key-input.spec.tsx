import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, render, fireEvent, cleanup } from "@testing-library/react";
import { createRef } from "react";

// Controllable state shared with the hoisted vi.mock factories.
const h = vi.hoisted(() => ({
  activeUser: { username: "testuser" } as { username: string } | null,
  errorSpy: vi.fn(),
  setSigningKey: vi.fn()
}));

// KeyInput imports only `error` from the shared barrel; stub it to a spy so we
// can count exactly how many user-facing toasts are produced.
vi.mock("@/features/shared", () => ({
  error: (message: string) => h.errorSpy(message)
}));

vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: (s: { setSigningKey: typeof h.setSigningKey }) => unknown) =>
    selector({ setSigningKey: h.setSigningKey })
}));

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: () => ({ activeUser: h.activeUser })
}));

import { KeyInput, KeyInputImperativeHandle } from "@ui/input";
import { isWif, PrivateKey } from "@ecency/sdk";

const mockIsWif = vi.mocked(isWif);
const mockFromString = vi.mocked(PrivateKey.fromString);

function setup(value?: string) {
  const ref = createRef<KeyInputImperativeHandle>();
  const { container } = render(<KeyInput ref={ref} keyType="active" />);
  const input = container.querySelector('input[type="password"]') as HTMLInputElement;
  if (value !== undefined) {
    fireEvent.change(input, { target: { value } });
  }
  return { ref, input };
}

describe("KeyInput.handleSign contract", () => {
  beforeEach(() => {
    h.activeUser = { username: "testuser" };
    h.errorSpy.mockClear();
    h.setSigningKey.mockClear();
    mockIsWif.mockReset().mockReturnValue(false);
    mockFromString.mockReset();
  });

  afterEach(cleanup);

  it("resolves to null (does not throw) and shows one toast for an empty key", async () => {
    const { ref } = setup();

    let result: unknown;
    await act(async () => {
      result = await ref.current!.handleSign();
    });

    expect(result).toBeNull();
    expect(h.errorSpy).toHaveBeenCalledTimes(1);
    expect(h.errorSpy).toHaveBeenCalledWith("validation.required");
  });

  it("resolves to null (does not throw) and shows one toast for an invalid key", async () => {
    mockIsWif.mockReturnValue(true);
    mockFromString.mockImplementation(() => {
      throw new Error("bad key");
    });
    const { ref } = setup("not-a-real-key");

    let result: unknown;
    await act(async () => {
      // Regression guard for the unhandled-rejection bug: this MUST resolve,
      // not reject. If handleSign throws here the test fails.
      result = await ref.current!.handleSign();
    });

    expect(result).toBeNull();
    expect(h.errorSpy).toHaveBeenCalledTimes(1);
    expect(h.errorSpy).toHaveBeenCalledWith("key-or-hot.key-error");
  });

  it("uses the invalid-key message when the parse error mentions base58", async () => {
    mockIsWif.mockReturnValue(true);
    mockFromString.mockImplementation(() => {
      throw new Error("Expected base58-encoded string");
    });
    const { ref } = setup("not-a-real-key");

    let result: unknown;
    await act(async () => {
      result = await ref.current!.handleSign();
    });

    expect(result).toBeNull();
    expect(h.errorSpy).toHaveBeenCalledTimes(1);
    expect(h.errorSpy).toHaveBeenCalledWith("key-or-hot.invalid-key");
  });

  it("resolves with { privateKey, raw } for a valid key", async () => {
    const fakeKey = { toString: () => "PVT_FAKE" } as unknown as PrivateKey;
    mockIsWif.mockReturnValue(true);
    mockFromString.mockReturnValue(fakeKey);
    const { ref } = setup("5JvalidWifKey");

    let result: { privateKey: PrivateKey; raw: string } | null = null;
    await act(async () => {
      result = await ref.current!.handleSign();
    });

    expect(result).toEqual({ privateKey: fakeKey, raw: "5JvalidWifKey" });
    expect(h.setSigningKey).toHaveBeenCalledWith("5JvalidWifKey");
    expect(h.errorSpy).not.toHaveBeenCalled();
  });

  it("still rejects for the anonymous-user invariant", async () => {
    h.activeUser = null;
    const { ref } = setup("anything");

    await act(async () => {
      await expect(ref.current!.handleSign()).rejects.toThrow(
        "Cannot sign operation with anon user"
      );
    });

    expect(h.errorSpy).not.toHaveBeenCalled();
  });
});
