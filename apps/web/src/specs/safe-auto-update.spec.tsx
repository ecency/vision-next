import { describe, it, expect, vi, beforeEach } from "vitest";
import { autoUpdate } from "@floating-ui/dom";
import { safeAutoUpdate } from "@ui/util/safe-auto-update";

vi.mock("@floating-ui/dom", () => ({
  autoUpdate: vi.fn()
}));

function createConnectedElement(): HTMLDivElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("safeAutoUpdate", () => {
  let autoUpdateCleanup: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    autoUpdateCleanup = vi.fn();
    vi.mocked(autoUpdate).mockReturnValue(autoUpdateCleanup);
  });

  it("returns no-op when reference is null", () => {
    const floating = createConnectedElement();
    const update = vi.fn();

    const dispose = safeAutoUpdate(null, floating, update);
    dispose();

    expect(autoUpdate).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    floating.remove();
  });

  it("returns no-op when floating is null", () => {
    const reference = createConnectedElement();
    const update = vi.fn();

    const dispose = safeAutoUpdate(reference, null, update);
    dispose();

    expect(autoUpdate).not.toHaveBeenCalled();
    reference.remove();
  });

  it("returns no-op when reference is disconnected", () => {
    const reference = document.createElement("div"); // not appended
    const floating = createConnectedElement();
    const update = vi.fn();

    const dispose = safeAutoUpdate(reference, floating, update);
    dispose();

    expect(autoUpdate).not.toHaveBeenCalled();
    floating.remove();
  });

  it("returns no-op when floating is disconnected", () => {
    const reference = createConnectedElement();
    const floating = document.createElement("div"); // not appended
    const update = vi.fn();

    const dispose = safeAutoUpdate(reference, floating, update);
    dispose();

    expect(autoUpdate).not.toHaveBeenCalled();
    reference.remove();
  });

  it("calls autoUpdate with wrapped update when elements are connected", () => {
    const reference = createConnectedElement();
    const floating = createConnectedElement();
    const update = vi.fn();

    safeAutoUpdate(reference, floating, update);

    expect(autoUpdate).toHaveBeenCalledOnce();
    expect(autoUpdate).toHaveBeenCalledWith(
      reference,
      floating,
      expect.any(Function), // safeUpdate wrapper
      undefined
    );

    // The safeUpdate wrapper should call the original update
    const safeUpdate = vi.mocked(autoUpdate).mock.calls[0][2];
    safeUpdate();
    expect(update).toHaveBeenCalledOnce();

    reference.remove();
    floating.remove();
  });

  it("dispose disconnects observer and calls autoUpdate cleanup", () => {
    const reference = createConnectedElement();
    const floating = createConnectedElement();

    const dispose = safeAutoUpdate(reference, floating, vi.fn());
    dispose();

    expect(autoUpdateCleanup).toHaveBeenCalledOnce();

    reference.remove();
    floating.remove();
  });

  it("dispose is idempotent", () => {
    const reference = createConnectedElement();
    const floating = createConnectedElement();

    const dispose = safeAutoUpdate(reference, floating, vi.fn());
    dispose();
    dispose();

    expect(autoUpdateCleanup).toHaveBeenCalledTimes(1);

    reference.remove();
    floating.remove();
  });

  it("safeUpdate skips update and disposes when floating becomes disconnected", () => {
    const reference = createConnectedElement();
    const floating = createConnectedElement();
    const update = vi.fn();

    safeAutoUpdate(reference, floating, update);

    const safeUpdate = vi.mocked(autoUpdate).mock.calls[0][2];

    // Disconnect floating
    floating.remove();
    safeUpdate();

    expect(update).not.toHaveBeenCalled();
    expect(autoUpdateCleanup).toHaveBeenCalledOnce();

    reference.remove();
  });

  it("safeUpdate skips update and disposes when reference becomes disconnected", () => {
    const reference = createConnectedElement();
    const floating = createConnectedElement();
    const update = vi.fn();

    safeAutoUpdate(reference, floating, update);

    const safeUpdate = vi.mocked(autoUpdate).mock.calls[0][2];

    // Disconnect reference
    reference.remove();
    safeUpdate();

    expect(update).not.toHaveBeenCalled();
    expect(autoUpdateCleanup).toHaveBeenCalledOnce();

    floating.remove();
  });

  it("safeUpdate swallows errors thrown by update callback", () => {
    const reference = createConnectedElement();
    const floating = createConnectedElement();
    const update = vi.fn(() => {
      throw new Error("computePosition failed");
    });

    safeAutoUpdate(reference, floating, update);

    const safeUpdate = vi.mocked(autoUpdate).mock.calls[0][2];

    // Should not throw
    expect(() => safeUpdate()).not.toThrow();
    expect(update).toHaveBeenCalledOnce();

    reference.remove();
    floating.remove();
  });

  it("handles autoUpdate throwing during initialization", () => {
    const reference = createConnectedElement();
    const floating = createConnectedElement();

    vi.mocked(autoUpdate).mockImplementation(() => {
      throw new Error("init failed");
    });

    // Should not throw
    const dispose = safeAutoUpdate(reference, floating, vi.fn());
    expect(dispose).toBeTypeOf("function");
    dispose(); // calling dispose on failed init should be safe

    reference.remove();
    floating.remove();
  });

  it("accepts virtual reference (non-Node) and treats as connected", () => {
    const virtualRef = {
      getBoundingClientRect: () => new DOMRect(),
      contextElement: document.body
    };
    const floating = createConnectedElement();
    const update = vi.fn();

    safeAutoUpdate(virtualRef, floating, update);

    expect(autoUpdate).toHaveBeenCalledOnce();

    // safeUpdate should call update (virtual ref always treated as connected)
    const safeUpdate = vi.mocked(autoUpdate).mock.calls[0][2];
    safeUpdate();
    expect(update).toHaveBeenCalledOnce();

    floating.remove();
  });
});
