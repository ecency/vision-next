import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "@/specs/test-utils";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { TrendingTagsCard } from "@/app/_components/trending-tags-card";

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: vi.fn()
}));

let sections = ["hot", ""];
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ sections })
}));

// The global @/utils mock keeps only two members; TagLink needs isCommunity.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<typeof import("@/utils")>("@/utils")),
  getAccessToken: vi.fn(() => "mock-token")
}));

vi.mock("@/core/caches", () => ({
  getCommunityCache: (tag: string) => ({
    queryKey: ["community", tag],
    queryFn: async () => null,
    enabled: false
  })
}));

let followedTags: string[] = [];
let trending = ["hive", "photography", "life", "art"];

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual<typeof import("@ecency/sdk")>("@ecency/sdk");
  return {
    ...actual,
    getTrendingTagsQueryOptions: vi.fn(() => ({
      queryKey: ["trending-tags", 250],
      queryFn: async () => trending,
      initialPageParam: 0,
      getNextPageParam: () => undefined
    })),
    getFavoriteTagsInfiniteQueryOptions: vi.fn((username?: string, _code?: string, limit = 10) => ({
      queryKey: ["accounts", "favorite-tags", "infinite", username, limit],
      queryFn: async () => ({
        data: followedTags.map((tag) => ({ _id: `id-${tag}`, tag, created: "", timestamp: 1 })),
        pagination: { total: followedTags.length, limit, offset: 0, has_next: false }
      }),
      initialPageParam: 0,
      getNextPageParam: () => undefined,
      enabled: !!username
    })),
    useFavoriteTagAdd: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useFavoriteTagDelete: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }))
  };
});

// Topic links are separate from their follow and dismiss actions.
const chipTexts = () =>
  Array.from(document.querySelectorAll(".feed-topic-list a")).map((a) =>
    (a.textContent ?? "").replace(/^#/, "").trim()
  );

describe("TrendingTagsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    followedTags = [];
    sections = ["hot", ""];
    trending = ["hive", "photography", "life", "art"];
  });

  it("pins the user's followed tags first and lists each tag once", async () => {
    vi.mocked(useActiveAccount).mockReturnValue({ activeUser: { username: "alice" } } as never);
    followedTags = ["art", "contest-2026"];

    renderWithQueryClient(<TrendingTagsCard />);

    await screen.findByText("contest-2026");
    expect(chipTexts()).toEqual(["art", "contest-2026", "hive", "photography", "life"]);
    // Every chip carries the follow toggle; the pinned ones read as followed.
    expect(screen.getAllByRole("button", { name: "follow-tag.delete" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "follow-tag.add" })).toHaveLength(3);
  });

  it("shows the plain trending list without toggles to a signed-out reader", async () => {
    vi.mocked(useActiveAccount).mockReturnValue({ activeUser: null } as never);

    renderWithQueryClient(<TrendingTagsCard />);

    await screen.findByText("art");
    expect(chipTexts()).toEqual(trending);
    expect(screen.queryByRole("button", { name: "follow-tag.add" })).not.toBeInTheDocument();
  });
  it("limits suggestions, keeps the selected topic and offers the full topics page", async () => {
    vi.mocked(useActiveAccount).mockReturnValue({ activeUser: { username: "alice" } } as never);
    trending = ["hive", "photography", "life", "art", "gaming", "music", "gardening", "travel"];
    sections = ["hot", "travel"];
    renderWithQueryClient(<TrendingTagsCard />);
    await screen.findByText("travel");
    expect(chipTexts()).toHaveLength(6);
    expect(screen.getByText("travel").closest("a")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "trending-tags.explore" })).toHaveAttribute(
      "href",
      "/tags"
    );
    fireEvent.click(screen.getByRole("button", { name: "g.dismiss" }));
    expect(push).toHaveBeenCalledWith("/hot/my");
  });

  it("does not put follow controls inside navigation links", async () => {
    vi.mocked(useActiveAccount).mockReturnValue({ activeUser: { username: "alice" } } as never);
    renderWithQueryClient(<TrendingTagsCard />);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "follow-tag.add" })).toHaveLength(4)
    );
    for (const control of screen.getAllByRole("button", { name: "follow-tag.add" })) {
      expect(control.closest("a")).toBeNull();
    }
  });
});
