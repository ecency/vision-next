import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient, mockCommunity } from "@/specs/test-utils";
import type { Community } from "@/entities";

const subscribe = vi.fn(async () => undefined);
const unsubscribe = vi.fn(async () => undefined);
let ranked: Community[] = [];
let town: Community | null = null;
let failTown = false;
let failRanked = false;
let subscriptions: string[][] = [];

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: () => ({ activeUser: { username: "alice" } })
}));
vi.mock("@/features/shared", () => ({
  LoginRequired: ({ children }: React.PropsWithChildren) => <>{children}</>
}));
vi.mock("@/features/shared/user-avatar", () => ({
  UserAvatar: () => <span />
}));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<typeof import("@/utils")>("@/utils"))
}));
vi.mock("@/core/caches", () => ({
  getCommunityCache: () => ({
    queryKey: ["town"],
    queryFn: async () => {
      if (failTown) throw new Error("Town Square unavailable");
      return town;
    }
  })
}));
vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<typeof import("@ecency/sdk")>("@ecency/sdk")),
  getCommunitiesQueryOptions: () => ({
    queryKey: ["ranked"],
    queryFn: async () => {
      if (failRanked) throw new Error("Ranked communities unavailable");
      return ranked;
    }
  }),
  getAccountSubscriptionsQueryOptions: () => ({
    queryKey: ["subscriptions"],
    queryFn: async () => subscriptions
  })
}));
vi.mock("@/api/sdk-mutations", () => ({
  useSubscribeCommunityMutation: () => ({ mutateAsync: subscribe, isPending: false }),
  useUnsubscribeCommunityMutation: () => ({ mutateAsync: unsubscribe, isPending: false })
}));

import { TopCommunitiesWidget } from "@/app/_components/top-communities-widget";

describe("feed community suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    failTown = false;
    failRanked = false;
    subscriptions = [];
    town = mockCommunity({ name: "hive-125125", title: "Town Square" });
    ranked = [
      town,
      mockCommunity({ name: "hive-100001", title: "Photography" }),
      mockCommunity({ name: "hive-100002", title: "Gaming" }),
      mockCommunity({ name: "hive-100003", title: "Music" })
    ];
  });

  it("shows Town Square plus two distinct ranked communities and keeps discovery and creation reachable", async () => {
    renderWithQueryClient(<TopCommunitiesWidget />);
    await screen.findByRole("link", { name: "Town Square" });
    const others = ["Photography", "Gaming", "Music"];
    await waitFor(() =>
      expect(others.filter((t) => screen.queryByRole("link", { name: t })).length).toBe(2)
    );
    expect(screen.getAllByRole("link", { name: "Town Square" })).toHaveLength(1);
    const shown = others.filter((t) => screen.queryByRole("link", { name: t }));
    for (const title of shown) {
      const name = ranked.find((c) => c.title === title)!.name;
      expect(screen.getByRole("link", { name: title })).toHaveAttribute("href", `/created/${name}`);
    }
    expect(screen.getByRole("link", { name: "top-communities.explore" })).toHaveAttribute(
      "href",
      "/communities"
    );
    expect(screen.getByRole("link", { name: "top-communities.create-button" })).toHaveAttribute(
      "href",
      "/communities/create"
    );
  });

  it("rotates the two unpinned slots between page loads instead of always showing the leaders", async () => {
    // The pair is drawn from the top of the ranking with a per-mount seed, so
    // different loads surface different communities. Drive the seed directly.
    ranked = [
      town,
      ...Array.from({ length: 8 }, (_, i) =>
        mockCommunity({ name: `hive-20000${i}`, title: `Community ${i}` })
      )
    ];
    const pairs = new Set<string>();
    for (const seed of [0.05, 0.35, 0.65, 0.95]) {
      vi.spyOn(Math, "random").mockReturnValueOnce(seed);
      const { unmount } = renderWithQueryClient(<TopCommunitiesWidget />);
      await screen.findByRole("link", { name: "Town Square" });
      await waitFor(() =>
        expect(screen.getAllByRole("link", { name: /^Community \d$/ })).toHaveLength(2)
      );
      pairs.add(
        screen
          .getAllByRole("link", { name: /^Community \d$/ })
          .map((l) => l.textContent)
          .sort()
          .join("|")
      );
      unmount();
    }
    expect(pairs.size).toBeGreaterThan(1);
    // Town Square is pinned and never drawn twice.
    expect([...pairs].every((p) => !p.includes("Town Square"))).toBe(true);
  });

  it("renders the ranked list even when the Town Square request fails", async () => {
    failTown = true;
    ranked = ranked.slice(1);
    renderWithQueryClient(<TopCommunitiesWidget />);
    await screen.findByRole("link", { name: "Music" });
    expect(screen.getByRole("link", { name: "Photography" })).toBeInTheDocument();
  });

  it("handles duplicates without hanging or repeating a community", async () => {
    ranked = [town!, town!, ranked[1], ranked[1]];
    renderWithQueryClient(<TopCommunitiesWidget />);
    await screen.findByRole("link", { name: "Photography" });
    expect(screen.getAllByRole("link", { name: "Town Square" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Photography" })).toHaveLength(1);
  });

  it("keeps cached Town Square available if ranking fails", async () => {
    failRanked = true;
    renderWithQueryClient(<TopCommunitiesWidget />);
    expect(await screen.findByRole("link", { name: "Town Square" })).toBeInTheDocument();
  });

  it("retains join, joined status, and unsubscribe with the compact presentation", async () => {
    ranked = [];
    renderWithQueryClient(<TopCommunitiesWidget />);
    fireEvent.click(await screen.findByRole("button", { name: "community.subscribe" }));
    await waitFor(() => expect(subscribe).toHaveBeenCalledWith({ community: "hive-125125" }));
    const joined = await screen.findByRole("button", { name: "community.subscribed" });
    await waitFor(() => expect(joined).toBeEnabled());
    fireEvent.click(joined);
    await waitFor(() => expect(unsubscribe).toHaveBeenCalledWith({ community: "hive-125125" }));
    expect(await screen.findByRole("button", { name: "community.subscribe" })).toBeInTheDocument();
  });

  it("keeps discovery links available when both requests fail", async () => {
    failRanked = failTown = true;
    renderWithQueryClient(<TopCommunitiesWidget />);
    expect(await screen.findByText("g.server-error")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "top-communities.explore" })).toHaveAttribute(
      "href",
      "/communities"
    );
  });
});
