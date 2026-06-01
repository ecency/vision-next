import { vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const useActiveAccount = vi.fn(() => ({ activeUser: { username: "tester" } as { username: string } | null }));
vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: () => useActiveAccount()
}));

vi.mock("@ecency/sdk", () => ({
  getQuestsQueryOptions: (username?: string) => ({
    queryKey: ["quests", "status", username],
    queryFn: async () => ({}),
    enabled: !!username,
    staleTime: Infinity
  })
}));

import { NavbarPerksButton } from "@/features/shared/navbar/navbar-perks-button";

type Streak = { current: number; best: number; at_risk: boolean };

function renderWith(streak?: Streak) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (streak) {
    queryClient.setQueryData(["quests", "status", "tester"], { streak });
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <NavbarPerksButton />
    </QueryClientProvider>
  );
}

const markPerksSeen = () => localStorage.setItem("ecency_perks_seen", "true");
const dot = (container: HTMLElement) => container.querySelector(".perks-badge-dot");
const control = (container: HTMLElement) => container.querySelector("a, button")!;

describe("NavbarPerksButton", () => {
  beforeEach(() => {
    localStorage.clear();
    useActiveAccount.mockReturnValue({ activeUser: { username: "tester" } });
  });

  test("shows the 🔥 streak count when an active streak exists", () => {
    markPerksSeen();
    const { container } = renderWith({ current: 7, best: 12, at_risk: false });
    expect(container.textContent).toContain("🔥");
    expect(container.textContent).toContain("7");
  });

  test("uses the at-risk (orange) styling when the streak is at risk", () => {
    markPerksSeen();
    const { container } = renderWith({ current: 3, best: 8, at_risk: true });
    expect(control(container).className).toContain("text-orange-500");
  });

  test("renders the plain perks button (no dot) when seen and no active streak", () => {
    markPerksSeen();
    const { container } = renderWith({ current: 0, best: 5, at_risk: false });
    expect(container.textContent).not.toContain("🔥");
    expect(control(container).getAttribute("aria-label")).toBe("user-nav.perks");
    expect(dot(container)).toBeNull();
  });

  test("renders the plain perks button for logged-out users with no dot", () => {
    useActiveAccount.mockReturnValue({ activeUser: null });
    const { container } = renderWith();
    expect(control(container).getAttribute("aria-label")).toBe("user-nav.perks");
    expect(dot(container)).toBeNull();
  });

  test("shows the dot when the streak is at risk", () => {
    markPerksSeen(); // isolate at-risk as the only trigger
    const { container } = renderWith({ current: 4, best: 9, at_risk: true });
    expect(dot(container)).not.toBeNull();
  });

  test("shows a one-time discovery dot for users who have never opened /perks", () => {
    // localStorage cleared in beforeEach → never seen
    const { container } = renderWith({ current: 6, best: 6, at_risk: false });
    expect(dot(container)).not.toBeNull();
  });

  test("hides the dot once /perks has been opened and the streak is not at risk", () => {
    markPerksSeen();
    const { container } = renderWith({ current: 6, best: 6, at_risk: false });
    expect(dot(container)).toBeNull();
  });
});
