import { useAdvancedManager } from "@/app/submit/_hooks/advanced-manager";
import { PREFIX } from "@/utils/local-storage";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

// Regression: react-use's useLocalStorage memoizes its setter against the
// state captured on the first render, so functional updates used to run
// against the mount-time snapshot and silently drop rows added since mount
// (e.g. a draft's beneficiaries replaced by just the injected ecency row).
// useAdvancedManager now resolves updaters against the latest value.
describe("useAdvancedManager beneficiaries setter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("applies a functional update to the latest list, not the mount snapshot", () => {
    const { result } = renderHook(() => useAdvancedManager());

    act(() => {
      result.current.setBeneficiaries([{ account: "bob", weight: 1000 }]);
    });
    act(() => {
      result.current.setBeneficiaries((prev) => [...prev, { account: "ecency", weight: 500 }]);
    });

    expect(result.current.beneficiaries).toEqual([
      { account: "bob", weight: 1000 },
      { account: "ecency", weight: 500 }
    ]);
  });

  it("chains functional updates issued within the same commit", () => {
    const { result } = renderHook(() => useAdvancedManager());

    act(() => {
      result.current.setBeneficiaries((prev) => [...prev, { account: "bob", weight: 1000 }]);
      result.current.setBeneficiaries((prev) => [...prev, { account: "ecency", weight: 500 }]);
    });

    expect(result.current.beneficiaries).toEqual([
      { account: "bob", weight: 1000 },
      { account: "ecency", weight: 500 }
    ]);
  });

  it("keeps working across a remount with a persisted list", () => {
    const first = renderHook(() => useAdvancedManager());
    act(() => {
      first.result.current.setBeneficiaries([{ account: "bob", weight: 1000 }]);
    });
    first.unmount();

    const second = renderHook(() => useAdvancedManager());
    expect(second.result.current.beneficiaries).toEqual([{ account: "bob", weight: 1000 }]);

    act(() => {
      second.result.current.setBeneficiaries((prev) => [
        ...prev,
        { account: "ecency", weight: 500 }
      ]);
    });

    expect(second.result.current.beneficiaries).toEqual([
      { account: "bob", weight: 1000 },
      { account: "ecency", weight: 500 }
    ]);
    expect(JSON.parse(localStorage.getItem(PREFIX + "_sa_b") ?? "[]")).toEqual([
      { account: "bob", weight: 1000 },
      { account: "ecency", weight: 500 }
    ]);
  });
});
