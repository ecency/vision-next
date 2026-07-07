import { BeneficiaryRoute } from "@/entities";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: vi.fn(() => ({ activeUser: { username: "alice" } }))
}));

// The settings query resolves through this mutable holder so each test can
// choose the stored preference before rendering.
let settingsResponse: { username: string; beneficiary_percent: number; curation_percent: number };

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual<typeof import("@ecency/sdk")>("@ecency/sdk");
  return {
    ...actual,
    getSupportSettingsQueryOptions: vi.fn((username?: string) => ({
      queryKey: ["support", "settings", username],
      queryFn: async () => settingsResponse,
      enabled: !!username,
      retry: false
    }))
  };
});

import {
  SupportEcencyInjectionOptions,
  useSupportEcencyBeneficiaryInjection
} from "@/features/support-ecency";

interface HarnessProps {
  initial?: BeneficiaryRoute[];
  options?: SupportEcencyInjectionOptions;
}

function useHarness({ initial = [], options }: HarnessProps) {
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRoute[]>(initial);
  useSupportEcencyBeneficiaryInjection(beneficiaries, setBeneficiaries, options);
  return { beneficiaries, setBeneficiaries };
}

function renderHarness(props: HarnessProps = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const utils = renderHook(() => useHarness(props), { wrapper });
  const waitForSettingsQuery = () =>
    waitFor(() =>
      expect(queryClient.getQueryState(["support", "settings", "alice"])?.status).toBe("success")
    );
  return { ...utils, queryClient, waitForSettingsQuery };
}

describe("useSupportEcencyBeneficiaryInjection", () => {
  beforeEach(() => {
    settingsResponse = { username: "alice", beneficiary_percent: 5, curation_percent: 0 };
  });

  it("injects the stored preference once as basis points", async () => {
    const { result } = renderHarness();

    await waitFor(() =>
      expect(result.current.beneficiaries).toEqual([{ account: "ecency", weight: 500 }])
    );
  });

  it("reports the session as settled after injecting", async () => {
    const setSettled = vi.fn();
    renderHarness({ options: { settled: false, setSettled } });

    await waitFor(() => expect(setSettled).toHaveBeenCalledWith(true));
  });

  it("does not inject when the persisted settled flag is set (reload after a manual removal)", async () => {
    const setSettled = vi.fn();
    const { result, waitForSettingsQuery } = renderHarness({
      options: { settled: true, setSettled }
    });

    await waitForSettingsQuery();
    expect(result.current.beneficiaries).toEqual([]);
    expect(setSettled).not.toHaveBeenCalled();
  });

  it("does not inject when disabled (edit route)", async () => {
    const { result, waitForSettingsQuery } = renderHarness({ options: { enabled: false } });

    await waitForSettingsQuery();
    expect(result.current.beneficiaries).toEqual([]);
  });

  it("keeps an existing ecency row untouched and marks the session settled", async () => {
    const setSettled = vi.fn();
    const { result, waitForSettingsQuery } = renderHarness({
      initial: [{ account: "ecency", weight: 100 }],
      options: { settled: false, setSettled }
    });

    await waitForSettingsQuery();
    await waitFor(() => expect(setSettled).toHaveBeenCalledWith(true));
    expect(result.current.beneficiaries).toEqual([{ account: "ecency", weight: 100 }]);
  });

  it("skips injection when the Hive weight limit would be exceeded", async () => {
    const setSettled = vi.fn();
    const { result, waitForSettingsQuery } = renderHarness({
      initial: [{ account: "bob", weight: 9800 }],
      options: { settled: false, setSettled }
    });

    await waitForSettingsQuery();
    expect(result.current.beneficiaries).toEqual([{ account: "bob", weight: 9800 }]);
    expect(setSettled).not.toHaveBeenCalled();
  });

  it("does nothing when the stored preference is off", async () => {
    settingsResponse = { username: "alice", beneficiary_percent: 0, curation_percent: 25 };
    const { result, waitForSettingsQuery } = renderHarness();

    await waitForSettingsQuery();
    expect(result.current.beneficiaries).toEqual([]);
  });
});
