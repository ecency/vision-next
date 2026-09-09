import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "@/specs/test-utils";
import { installFetchRouter, makeRoster, makeRow, rowWindowProps } from "./curation-test-utils";

vi.mock("@ecency/sdk", async () => ({ ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")) }));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/utils")),
  ensureValidToken: vi.fn(async () => "code-1"),
}));
vi.mock("@/config", () => ({
  EcencyConfigManager: {
    useConfig: (condition: (config: unknown) => unknown) =>
      condition({ visionFeatures: { curationDesk: { enabled: true, recommendations: { enabled: true } } } }),
  },
}));
vi.mock("@/core/hooks/use-active-username", () => ({ useActiveUsername: () => "member1" }));
vi.mock("@/core/hooks/use-active-account", () => ({ useActiveAccount: () => ({ activeUser: { username: "member1" }, account: null }) }));
vi.mock("@/core/global-store", () => ({ useGlobalStore: (selector: (s: unknown) => unknown) => selector({ toggleUiProp: vi.fn(), activeUser: { username: "member1" } }) }));
vi.mock("@/features/shared/profile-popover", () => ({ ProfilePopover: ({ entry }: { entry: { author: string } }) => <span>@{entry.author}</span> }));
vi.mock("@/features/shared/user-avatar", () => ({ UserAvatar: () => <span /> }));
vi.mock("@/features/shared/feedback", () => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/api/format-error", () => ({ formatError: (e: unknown) => [String(e), "common"] }));
vi.mock("@/api/sdk-mutations/use-curation-recommend-mutation", () => ({ useCurationRecommendMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }));

import { CurationQueueRow } from "@/features/curation-desk/curation-queue-row";
import { CurationRecommendationsView } from "@/features/curation-desk/curation-recommendations-view";
import type { DeskRow } from "@/features/curation-desk/types";

const actions = {
  onSelect: vi.fn(), onOpen: vi.fn(), onVote: vi.fn(), onReviewed: vi.fn(),
  onSnooze: vi.fn(), onFlag: vi.fn(), onNote: vi.fn(), onClearMark: vi.fn(),
};

function renderRow(row: DeskRow, tapToOpen: boolean) {
  return renderWithQueryClient(
    <CurationQueueRow row={row} isActive={false} isRoster={false} isTrial={false} username="member1"
      recommendationsEnabled tapToOpen={tapToOpen} section="queue" late={false} resurfaced={false}
      belowCursor={false} reviewedByCursor={false} chronological {...rowWindowProps(row)} {...actions} />
  );
}

/**
 * The drawer carries the reading pane and every mark, and the only ways into it
 * were a double click on the row (which a touch screen never sends) and the
 * vote button. Curators on phones opened the post in a new tab instead, where
 * there is no reviewed and no next, and reported the desk as unusable there.
 */
describe("opening a post from a desk row", () => {
  beforeEach(() => {
    for (const fn of Object.values(actions)) fn.mockReset();
  });

  it("opens the drawer on a single tap where the pointer is a finger", () => {
    const row = makeRow({ post_id: 1 });
    renderRow(row, true);
    fireEvent.click(screen.getByRole("article"));
    expect(actions.onOpen).toHaveBeenCalledWith(row);
    expect(actions.onSelect).not.toHaveBeenCalled();
  });

  it("still only selects on a click with a mouse, where the double click opens", () => {
    const row = makeRow({ post_id: 2 });
    renderRow(row, false);
    const article = screen.getByRole("article");
    fireEvent.click(article);
    expect(actions.onSelect).toHaveBeenCalledWith(row);
    expect(actions.onOpen).not.toHaveBeenCalled();
    fireEvent.doubleClick(article);
    expect(actions.onOpen).toHaveBeenCalledWith(row);
  });

  it("offers a read control on either pointer, worded on the one that cannot hover a tooltip", () => {
    const row = makeRow({ post_id: 3 });
    const { unmount } = renderRow(row, false);
    const read = screen.getByRole("button", { name: "curation-desk.actions.read-key" });
    expect(read).not.toHaveTextContent("curation-desk.actions.read");
    fireEvent.click(read);
    expect(actions.onOpen).toHaveBeenCalledWith(row);
    unmount();

    renderRow(row, true);
    expect(screen.getByRole("button", { name: "curation-desk.actions.read-key" })).toHaveTextContent(
      "curation-desk.actions.read"
    );
  });
});

/** Route 4's rows carry the same cover column the queue draws from. */
describe("recommended list thumbnails", () => {
  let router: ReturnType<typeof installFetchRouter>;

  const item = (overrides: Record<string, unknown>) => ({
    author: "alice",
    permlink: "morning-light",
    title: "Morning light",
    created: new Date().toISOString(),
    recommend_count: 2,
    unique_recommenders: 2,
    no_meta_count: 0,
    reasons: {},
    recommenders: [],
    ...overrides,
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("draws the post's cover, and nothing at all when the row has none", async () => {
    router = installFetchRouter()
      .on(/curation-desk\/roster$/, () => makeRoster())
      .on(/curation-desk\/recommendations/, () => ({
        items: [
          item({ permlink: "with-cover", first_image: "https://images.ecency.com/p/cover.png" }),
          item({ permlink: "no-cover", first_image: null }),
        ],
        next_cursor: null,
      }));

    renderWithQueryClient(<CurationRecommendationsView />);
    await waitFor(() => expect(router.callsTo(/curation-desk\/recommendations/)).toHaveLength(1));

    const rows = await screen.findAllByRole("listitem");
    await waitFor(() => expect(rows[0].querySelector("img")).not.toBeNull());
    // Proxified at the queue row's width: the raw URL never reaches the img, so a
    // 4 MB cover is not what a phone downloads to draw a 48 px square.
    const src = rows[0].querySelector("img")!.getAttribute("src")!;
    expect(src).toMatch(/^https:\/\/i\.ecency\.com\//);
    expect(src).toContain("width=200");
    // No cover means no box: an empty grey square would only push the title over.
    expect(rows[1].querySelector("img")).toBeNull();
  });
});
