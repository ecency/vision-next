import React from "react";
import "@testing-library/jest-dom";
import { createEvent, fireEvent, screen, waitFor } from "@testing-library/react";
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

function renderRow(row: DeskRow, coarsePointer: boolean) {
  return renderWithQueryClient(
    <CurationQueueRow row={row} isActive={false} isRoster={false} isTrial={false} username="member1"
      recommendationsEnabled coarsePointer={coarsePointer} section="queue" late={false} resurfaced={false}
      belowCursor={false} reviewedByCursor={false} chronological {...rowWindowProps(row)} {...actions} />
  );
}

/**
 * A click preceded by its own pointerdown, the way a browser sends one. jsdom
 * implements no PointerEvent, and testing-library then builds a plain Event
 * that silently drops an unknown `pointerType` init key, so the field is put on
 * by hand. Passing no kind is the click of a browser that sends no pointerdown
 * at all.
 */
function clickWith(el: Element, kind?: string) {
  if (kind !== undefined) {
    const down = createEvent.pointerDown(el);
    Object.defineProperty(down, "pointerType", { value: kind });
    fireEvent(el, down);
  }
  fireEvent.click(el);
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

  it("opens the drawer for the click a finger made, on any device", () => {
    // The device half of this is deliberately hostile: coarsePointer is false,
    // which is what a touchscreen laptop or a tablet with a mouse attached
    // reports, and a media query alone would send this tap to onSelect.
    const row = makeRow({ post_id: 1 });
    renderRow(row, false);
    clickWith(screen.getByRole("article"), "touch");
    expect(actions.onOpen).toHaveBeenCalledWith(row);
    expect(actions.onSelect).not.toHaveBeenCalled();
  });

  it("opens for a stylus too, which cannot double click any more than a finger can", () => {
    const row = makeRow({ post_id: 2 });
    renderRow(row, false);
    clickWith(screen.getByRole("article"), "pen");
    expect(actions.onOpen).toHaveBeenCalledWith(row);
  });

  it("still only selects on a mouse click, even on a device that also has a touchscreen", () => {
    // coarsePointer true = a tablet; the click is a mouse click all the same.
    const row = makeRow({ post_id: 3 });
    renderRow(row, true);
    const article = screen.getByRole("article");
    clickWith(article, "mouse");
    expect(actions.onSelect).toHaveBeenCalledWith(row);
    expect(actions.onOpen).not.toHaveBeenCalled();
    fireEvent.doubleClick(article);
    expect(actions.onOpen).toHaveBeenCalledWith(row);
  });

  it("falls back to the device when the click carries no pointer at all", () => {
    // An old browser that sends no pointerdown, so pointerType is "" and the
    // primary-pointer query is the only thing left to go on.
    const phone = makeRow({ post_id: 4 });
    const { unmount } = renderRow(phone, true);
    clickWith(screen.getByRole("article"));
    expect(actions.onOpen).toHaveBeenCalledWith(phone);
    unmount();

    actions.onOpen.mockReset();
    const desktop = makeRow({ post_id: 5 });
    renderRow(desktop, false);
    clickWith(screen.getByRole("article"));
    expect(actions.onSelect).toHaveBeenCalledWith(desktop);
    expect(actions.onOpen).not.toHaveBeenCalled();
  });

  it("does not carry one click's pointer over to the next", () => {
    // The kind is consumed by the click it belongs to: a mouse click that
    // follows a tap must not inherit the tap.
    const row = makeRow({ post_id: 6 });
    renderRow(row, false);
    const article = screen.getByRole("article");
    clickWith(article, "touch");
    expect(actions.onOpen).toHaveBeenCalledTimes(1);
    fireEvent.click(article);
    expect(actions.onSelect).toHaveBeenCalledWith(row);
    expect(actions.onOpen).toHaveBeenCalledTimes(1);
  });

  it("offers a read control on either pointer, worded on the one that cannot hover a tooltip", () => {
    const row = makeRow({ post_id: 7 });
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
