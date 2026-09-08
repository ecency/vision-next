import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Entry } from "@/entities";

const cached = vi.hoisted(() => ({ value: undefined as unknown }));
const params = vi.hoisted(() => ({ value: { sections: ["feed", "@alice"] } as unknown }));

vi.mock("next/navigation", () => ({ useParams: () => params.value }));
vi.mock("@/api/queries", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/api/queries")),
  getPostsFeedQueryData: vi.fn(() => cached.value)
}));
vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: (state: unknown) => unknown) =>
    selector({ activeUser: { username: "alice" }, listStyle: "row" })
}));
vi.mock("@/features/shared/entry-list-content", () => ({
  EntryListContent: ({ entries }: { entries: Entry[] }) => (
    <div data-testid="entries">{entries.map((e) => e.permlink).join(",")}</div>
  )
}));

import { FeedLoading } from "@/app/(dynamicPages)/feed/_components/feed-loading";

describe("feed loading fallback", () => {
  afterEach(() => {
    cached.value = undefined;
    params.value = { sections: ["feed", "@alice"] };
  });

  it("shows the feed the reader already has instead of skeletons", () => {
    cached.value = {
      pages: [[{ author: "bob", permlink: "one" }, { author: "carol", permlink: "two" }]],
      pageParams: [null]
    };

    const { container } = render(<FeedLoading />);

    expect(screen.getByTestId("entries")).toHaveTextContent("one,two");
    expect(container.querySelectorAll(".entry-list-loading-item")).toHaveLength(0);
  });

  it("falls back to skeletons when there is nothing cached", () => {
    const { container } = render(<FeedLoading />);

    expect(screen.queryByTestId("entries")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".entry-list-loading-item").length).toBeGreaterThan(0);
  });

  it("shows skeletons for a tag hivemind cannot answer", () => {
    // `queryable: false` means no query was ever made under this key, so any
    // cache hit would belong to a different feed.
    params.value = { sections: ["hot", "Not A Tag!"] };
    cached.value = { pages: [[{ author: "bob", permlink: "one" }]], pageParams: [null] };

    const { container } = render(<FeedLoading />);

    expect(screen.queryByTestId("entries")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".entry-list-loading-item").length).toBeGreaterThan(0);
  });
});
