import React from "react";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { QueryKeys } from "@ecency/sdk";
import type { Entry } from "@/entities";
import { renderWithQueryClient } from "@/specs/test-utils";
import { useActiveAccount } from "@/core/hooks/use-active-account";

const VIEWER = "viewer";

const cached = vi.hoisted(() => ({ value: undefined as unknown }));
const params = vi.hoisted(() => ({ value: { sections: ["feed", "@alice"] } as unknown }));
const search = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useParams: () => params.value,
  useSearchParams: () => new URLSearchParams(search.value)
}));
vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
  getMutedUsersQueryOptions: vi.fn((username?: string) => ({
    queryKey: QueryKeys.accounts.mutedUsers(username!),
    queryFn: async () => [] as string[],
    enabled: false
  }))
}));
vi.mock("@/api/queries", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/api/queries")),
  getPostsFeedQueryData: vi.fn(() => cached.value)
}));
vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: (state: unknown) => unknown) =>
    selector({ activeUser: { username: VIEWER }, listStyle: "row" })
}));
// Same seam feed-list.spec.tsx mocks: this spec is about which rows the
// fallback hands the list, not about how a card renders.
vi.mock("@/features/shared/entry-list-content", () => ({
  EntryListContent: ({ entries }: { entries: Entry[] }) => (
    <div data-testid="entries">{entries.map((e) => e.permlink).join(",")}</div>
  )
}));

import { FeedLoading } from "@/app/(dynamicPages)/feed/_components/feed-loading";

/** The mute list is a client query, so the fallback always needs a client. */
function renderFallback(muted?: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (muted) {
    queryClient.setQueryData(QueryKeys.accounts.mutedUsers(VIEWER), muted);
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: { username: VIEWER },
      username: VIEWER
    } as ReturnType<typeof useActiveAccount>);
  }
  return renderWithQueryClient(<FeedLoading />, { queryClient });
}

describe("feed loading fallback", () => {
  afterEach(() => {
    cached.value = undefined;
    params.value = { sections: ["feed", "@alice"] };
    search.value = "";
    vi.mocked(useActiveAccount).mockReset();
  });

  it("shows the feed the reader already has instead of skeletons", () => {
    cached.value = {
      pages: [[{ author: "bob", permlink: "one" }, { author: "carol", permlink: "two" }]],
      pageParams: [null]
    };

    const { container } = renderFallback();

    expect(screen.getByTestId("entries")).toHaveTextContent("one,two");
    expect(container.querySelectorAll(".entry-list-loading-item")).toHaveLength(0);
  });

  it("falls back to skeletons when there is nothing cached", () => {
    const { container } = renderFallback();

    expect(screen.queryByTestId("entries")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".entry-list-loading-item").length).toBeGreaterThan(0);
  });

  it("shows skeletons for a tag hivemind cannot answer", () => {
    // `queryable: false` means no query was ever made under this key, so any
    // cache hit would belong to a different feed.
    params.value = { sections: ["hot", "Not A Tag!"] };
    cached.value = { pages: [[{ author: "bob", permlink: "one" }]], pageParams: [null] };

    const { container } = renderFallback();

    expect(screen.queryByTestId("entries")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".entry-list-loading-item").length).toBeGreaterThan(0);
  });

  it("does not paint an author the reader has muted", () => {
    cached.value = {
      pages: [[{ author: "bob", permlink: "one" }, { author: "carol", permlink: "two" }]],
      pageParams: [null]
    };

    renderFallback(["bob"]);

    expect(screen.getByTestId("entries")).toHaveTextContent("two");
    expect(screen.getByTestId("entries")).not.toHaveTextContent("one");
  });

  it("shows skeletons when every cached row is muted", () => {
    cached.value = { pages: [[{ author: "bob", permlink: "one" }]], pageParams: [null] };

    const { container } = renderFallback(["bob"]);

    expect(screen.queryByTestId("entries")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".entry-list-loading-item").length).toBeGreaterThan(0);
  });

  it("honours the reader's no-reblog filter", () => {
    search.value = "no-reblog=true";
    cached.value = {
      pages: [
        [
          { author: "bob", permlink: "own" },
          { author: "carol", permlink: "reblogged", reblogged_by: ["dave"] }
        ]
      ],
      pageParams: [null]
    };

    renderFallback();

    expect(screen.getByTestId("entries")).toHaveTextContent("own");
    expect(screen.getByTestId("entries")).not.toHaveTextContent("reblogged");
  });
});
