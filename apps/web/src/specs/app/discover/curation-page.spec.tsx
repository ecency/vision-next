import { vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Shared, hoisted state the mocks below read at render time.
const mocks = vi.hoisted(() => ({ rows: [] as any[], queryClient: null as any }));

// Use the REAL formattedNumber (numeral-based) but avoid pulling the whole
// @/utils barrel — importActual only the small formatted-number module.
vi.mock("@/utils", async () => {
  const actual = (await vi.importActual("@/utils/formatted-number")) as any;
  return {
    random: vi.fn(),
    getAccessToken: vi.fn(() => "mock-token"),
    formattedNumber: actual.formattedNumber
  };
});

// Feature-flag gate -> always render children.
vi.mock("@/config", () => ({
  EcencyConfigManager: {
    Conditional: ({ children }: any) => <>{children}</>
  }
}));

// Lightweight table stand-ins so the assertion targets only the reward cell.
vi.mock("@/app/discover/_components", () => ({
  UsersTableListLayout: ({ children }: any) => <div>{children}</div>,
  UsersTableListItem: ({ children, username }: any) => (
    <div data-username={username}>{children}</div>
  ),
  UserTableListHeader: ({ children }: any) => <div>{children}</div>
}));

vi.mock("@tooni/iconscout-unicons-react", () => ({ UilInfoCircle: () => null }));
vi.mock("@ui/tooltip", () => ({ Tooltip: ({ children }: any) => <>{children}</> }));
vi.mock("@ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/core/react-query", () => ({
  getQueryClient: () => mocks.queryClient
}));

vi.mock("@ecency/sdk", () => ({
  getDiscoverCurationQueryOptions: (duration: string) => ({
    queryKey: ["analytics", "discover-curation", duration],
    queryFn: async () => mocks.rows
  })
}));

import CurationPage from "@/app/discover/@curation/page";

describe("Curators leaderboard — HP display", () => {
  beforeEach(() => {
    mocks.queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mocks.rows = [];
  });

  // Regression guard for the double VESTS->HP conversion bug (PR #934).
  // The curation API already returns Hive Power in the `vests` field (esync
  // converts VESTS->HP at ingest), so the page must render it as-is. If
  // someone re-introduces vestsToHp() here, 250 would become ~250/1e6 *
  // hivePerMVests and this exact-text assertion would fail.
  it("renders the curator reward straight through as HP, without a second conversion", async () => {
    mocks.rows = [{ account: "alice", hp: 250, vests: 250, votes: 12, uniques: 8, efficiency: 1 }];

    render(
      <QueryClientProvider client={mocks.queryClient}>
        <CurationPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("250.000 HP")).toBeInTheDocument();
  });
});
