import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "@/specs/test-utils";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { TrendingTagsCard } from "@/app/_components/trending-tags-card";
import i18next from "i18next";
import english from "@/features/i18n/locales/en-US.json";

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

// The order is one seed drawn from Math.random per mount, so the spies below on
// Math.random pick the order: a seed of 0 rotates the list by one place, any
// other seed keeps it as served. The generator itself has its own spec.
vi.mock("@/utils/seeded-shuffle", () => ({
  seededShuffle: vi.fn(<T,>(items: readonly T[], seed: number) =>
    seed === 0 ? [...items.slice(1), ...items.slice(0, 1)] : [...items]
  )
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
  within(screen.getByRole("list")).queryAllByRole("link").map((a) =>
    (a.textContent ?? "").replace(/^#/, "").trim()
  );

describe("TrendingTagsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    followedTags = [];
    sections = ["hot", ""];
    trending = ["hive", "photography", "life", "art"];
  });

  afterEach(() => {
    vi.mocked(Math.random).mockRestore();
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
    await screen.findByText("photography");
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

  it("randomizes suggestions while keeping selected and followed topics first and stable", async () => {
    vi.mocked(Math.random).mockReturnValue(0);
    vi.mocked(useActiveAccount).mockReturnValue({ activeUser: { username: "alice" } } as never);
    followedTags = ["art", "contest-2026"];
    sections = ["hot", "niche-topic"];
    trending = ["hive", "photography", "life", "art", "gaming", "music", "travel"];
    const { rerender, unmount, queryClient } = renderWithQueryClient(<TrendingTagsCard />);
    await waitFor(() =>
      expect(chipTexts()).toEqual([
        "niche-topic",
        "art",
        "contest-2026",
        "photography",
        "life",
        "gaming"
      ])
    );
    vi.mocked(Math.random).mockReturnValue(0.999);
    rerender(<TrendingTagsCard />);
    expect(chipTexts()).toEqual([
      "niche-topic",
      "art",
      "contest-2026",
      "photography",
      "life",
      "gaming"
    ]);
    expect(new Set(chipTexts()).size).toBe(6);
    unmount();
    renderWithQueryClient(<TrendingTagsCard />, { queryClient });
    await waitFor(() =>
      expect(chipTexts()).toEqual([
        "niche-topic",
        "art",
        "contest-2026",
        "hive",
        "photography",
        "life"
      ])
    );
  });

  it("keeps a non-trending route topic selected and dismissible", async () => {
    vi.mocked(useActiveAccount).mockReturnValue({ activeUser: null } as never);
    sections = ["created", "niche-topic"];
    renderWithQueryClient(<TrendingTagsCard />);
    await screen.findByText("photography");
    expect(chipTexts()[0]).toBe("niche-topic");
    expect(screen.getByText("niche-topic").closest("a")).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "g.dismiss" }));
    expect(push).toHaveBeenCalledWith("/created");
  });

  it("gives the icon-only dismiss control a translated accessible name", async () => {
    const { createInstance } = await vi.importActual<typeof import("i18next")>("i18next");
    const translations = createInstance();
    await translations.init({ lng: "en-US", resources: { "en-US": { translation: english } } });
    const translate = vi.spyOn(i18next, "t").mockImplementation(translations.t);
    try {
      vi.mocked(useActiveAccount).mockReturnValue({ activeUser: null } as never);
      sections = ["hot", "niche-topic"];
      renderWithQueryClient(<TrendingTagsCard />);
      fireEvent.click(screen.getByRole("button", { name: "Dismiss", exact: true }));
      expect(push).toHaveBeenCalledWith("/hot");
    } finally {
      translate.mockRestore();
    }
  });

  it.each([
    ["hot", "my"],
    ["hot", "global"],
    ["feed", "%40alice"],
    ["feed", "@alice"],
    ["hot", "%40alice"]
  ])("does not treat the %s/%s route marker as a selected topic", async (filter, tag) => {
    vi.mocked(useActiveAccount).mockReturnValue({ activeUser: { username: "alice" } } as never);
    sections = [filter, tag];
    renderWithQueryClient(<TrendingTagsCard />);
    await screen.findByText("photography");
    expect(chipTexts()).toEqual(trending);
    expect(screen.queryByRole("button", { name: "g.dismiss" })).not.toBeInTheDocument();
  });
});
