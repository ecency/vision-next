import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useActiveAccount } from "@/core/hooks/use-active-account";

// Route state is driven by the catch-all [...sections] segments. Tests mutate
// `mockSections` before rendering to simulate Following / Communities / Global.
let mockSections: string[] = [];
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ sections: mockSections }),
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/" + mockSections.join("/"),
  useSearchParams: () => new URLSearchParams()
}));

import { EntryIndexMenu } from "@/app/_components/entry-index-menu";

const mockedUseActiveAccount = vi.mocked(useActiveAccount);

function setLoggedIn(loggedIn: boolean) {
  mockedUseActiveAccount.mockReturnValue({
    activeUser: loggedIn ? ({ username: "alice" } as never) : null,
    username: loggedIn ? "alice" : null,
    account: null,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: loggedIn,
    error: null,
    refetch: vi.fn()
  } as ReturnType<typeof useActiveAccount>);
}

// i18next is globally mocked to echo the key, so labels are the i18n keys.
const SOURCE = {
  following: "entry-filter.filter-feed-friends",
  communities: "entry-filter.filter-feed-subscriptions",
  global: "entry-filter.filter-global"
};
const SORT = {
  trending: "entry-filter.filter-trending",
  hot: "entry-filter.filter-hot",
  created: "entry-filter.filter-created",
  top: "entry-filter.filter-top"
};

describe("EntryIndexMenu — Source × Sort filter bar", () => {
  beforeEach(() => {
    mockSections = [];
    mockPush.mockClear();
    setLoggedIn(false);
  });

  it("hides the source group for logged-out users and shows only sorts", () => {
    render(<EntryIndexMenu />);

    expect(screen.queryByRole("link", { name: SOURCE.following })).toBeNull();
    expect(screen.queryByRole("link", { name: SOURCE.communities })).toBeNull();

    expect(screen.getByRole("link", { name: SORT.trending }).getAttribute("href")).toBe("/trending");
    expect(screen.getByRole("link", { name: SORT.hot }).getAttribute("href")).toBe("/hot");
    expect(screen.getByRole("link", { name: SORT.created }).getAttribute("href")).toBe("/created");
    // "Top" surfaces the payout sort out of the overflow menu.
    expect(screen.getByRole("link", { name: SORT.top }).getAttribute("href")).toBe("/payout");
  });

  it("shows Following, Communities and Global as sources once logged in", () => {
    setLoggedIn(true);
    mockSections = ["hot"];
    render(<EntryIndexMenu />);

    expect(screen.getByRole("link", { name: SOURCE.following }).getAttribute("href")).toBe(
      "/@alice/feed"
    );
    expect(screen.getByRole("link", { name: SOURCE.communities }).getAttribute("href")).toBe(
      "/hot/my"
    );
    const global = screen.getByRole("link", { name: SOURCE.global });
    expect(global.getAttribute("href")).toBe("/hot");
    expect(global.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: SORT.hot }).getAttribute("aria-current")).toBe("page");
  });

  it("keeps the active sort when switching into Communities", () => {
    setLoggedIn(true);
    mockSections = ["trending", "my"];
    render(<EntryIndexMenu />);

    expect(
      screen.getByRole("link", { name: SOURCE.communities }).getAttribute("aria-current")
    ).toBe("page");
    // Sort links preserve the /my community context.
    expect(screen.getByRole("link", { name: SORT.trending }).getAttribute("href")).toBe(
      "/trending/my"
    );
    expect(screen.getByRole("link", { name: SORT.top }).getAttribute("href")).toBe("/payout/my");
    // Global drops the tag, keeping the current sort.
    expect(screen.getByRole("link", { name: SOURCE.global }).getAttribute("href")).toBe("/trending");
  });

  it("hides sorts and shows the reblog toggle on the Following feed", () => {
    setLoggedIn(true);
    mockSections = ["feed", "@alice"];
    render(<EntryIndexMenu />);

    expect(screen.queryByRole("link", { name: SORT.trending })).toBeNull();
    expect(screen.queryByRole("link", { name: SORT.top })).toBeNull();

    expect(
      screen.getByRole("link", { name: SOURCE.following }).getAttribute("aria-current")
    ).toBe("page");
    // Reblog toggle replaces the sort group (rendered for both desktop and mobile).
    expect(
      screen.getAllByRole("button", { name: "entry-filter.filter-no-reblog" }).length
    ).toBeGreaterThan(0);
  });

  it("shows a hashtag chip, leaves Global unselected and keeps the tag on sorts", () => {
    setLoggedIn(true);
    mockSections = ["trending", "photography"];
    render(<EntryIndexMenu />);

    // Active hashtag is its own selected source chip...
    const chip = screen.getByRole("link", { name: "#photography" });
    expect(chip.getAttribute("aria-current")).toBe("page");
    // ...so Global must NOT read as selected.
    expect(screen.getByRole("link", { name: SOURCE.global }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: SOURCE.global }).getAttribute("href")).toBe("/trending");

    // Sort tabs stay and preserve the hashtag.
    expect(screen.getByRole("link", { name: SORT.hot }).getAttribute("href")).toBe(
      "/hot/photography"
    );
    expect(screen.getByRole("link", { name: SORT.top }).getAttribute("href")).toBe(
      "/payout/photography"
    );
  });

  it("shows the hashtag chip and Global even for logged-out visitors", () => {
    mockSections = ["hot", "photography"];
    render(<EntryIndexMenu />);

    expect(screen.getByRole("link", { name: "#photography" }).getAttribute("aria-current")).toBe(
      "page"
    );
    // Logged-out users can clear the tag via Global, but get no Following/Communities.
    expect(screen.getByRole("link", { name: SOURCE.global }).getAttribute("href")).toBe("/hot");
    expect(screen.queryByRole("link", { name: SOURCE.following })).toBeNull();
    expect(screen.queryByRole("link", { name: SOURCE.communities })).toBeNull();
  });

  it("exposes Muted and Promoted behind the More filters menu", () => {
    setLoggedIn(true);
    mockSections = ["hot"];
    render(<EntryIndexMenu />);

    fireEvent.click(screen.getByRole("button", { name: "entry-filter.more-filters" }));

    expect(
      screen.getByRole("link", { name: "entry-filter.filter-muted" }).getAttribute("href")
    ).toBe("/muted");
    expect(
      screen.getByRole("link", { name: "entry-filter.filter-promoted" }).getAttribute("href")
    ).toBe("/promoted");
  });
});
