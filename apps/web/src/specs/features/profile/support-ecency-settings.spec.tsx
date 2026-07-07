import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "@/specs/test-utils";

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: vi.fn(() => ({ activeUser: { username: "alice" } }))
}));

// Avoid pulling the whole shared barrel (navbar, editors, ...) into the test.
vi.mock("@/features/shared", () => ({
  error: vi.fn(),
  success: vi.fn()
}));

let settingsQueryFn: () => Promise<unknown>;
const mutateAsync = vi.fn(async () => ({}));

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual<typeof import("@ecency/sdk")>("@ecency/sdk");
  return {
    ...actual,
    getSupportSettingsQueryOptions: vi.fn((username?: string) => ({
      queryKey: ["support", "settings", username],
      queryFn: () => settingsQueryFn(),
      enabled: !!username,
      retry: false
    })),
    useUpdateSupportSettings: vi.fn(() => ({ mutateAsync, isPending: false }))
  };
});

import { SupportEcencySettings } from "@/app/(dynamicPages)/profile/[username]/settings/_support-ecency";

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  renderWithQueryClient(<SupportEcencySettings />, { queryClient });
  return queryClient;
}

const settingsQueryState = (queryClient: QueryClient) =>
  queryClient.getQueryState(["support", "settings", "alice"])?.status;

describe("SupportEcencySettings write safety", () => {
  beforeEach(() => {
    mutateAsync.mockClear();
    settingsQueryFn = async () => ({
      username: "alice",
      beneficiary_percent: 5,
      curation_percent: 25
    });
  });

  it("keeps both selects disabled and refuses writes while the settings are loading", () => {
    settingsQueryFn = () => new Promise(() => {});
    renderCard();

    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
    selects.forEach((select) => expect(select).toBeDisabled());

    // Even if a change slipped through, the persist guard must refuse to
    // write while the other stored percent is unknown.
    fireEvent.change(selects[0], { target: { value: "10" } });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("keeps the selects disabled when the settings fetch fails", async () => {
    settingsQueryFn = () => Promise.reject(new Error("boom"));
    const queryClient = renderCard();

    await waitFor(() => expect(settingsQueryState(queryClient)).toBe("error"));

    screen.getAllByRole("combobox").forEach((select) => expect(select).toBeDisabled());
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "100" } });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("enables the selects once loaded and preserves the other stored percent on write", async () => {
    renderCard();

    const selects = screen.getAllByRole("combobox");
    await waitFor(() => expect(selects[0]).toBeEnabled());
    expect(selects[0]).toHaveValue("5");
    expect(selects[1]).toHaveValue("25");

    fireEvent.change(selects[0], { target: { value: "10" } });

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        beneficiary_percent: 10,
        curation_percent: 25
      })
    );
  });
});
