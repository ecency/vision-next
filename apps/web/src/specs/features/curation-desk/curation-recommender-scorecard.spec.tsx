import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurationRecommender } from "@ecency/sdk";
import { renderWithQueryClient } from "@/specs/test-utils";
import { installFetchRouter, jsonResponse, makePost, makeRow } from "./curation-test-utils";

const state = vi.hoisted(() => ({ username: "member1" as string | undefined }));

vi.mock("@ecency/sdk", async () => ({ ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")) }));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/utils")),
  ensureValidToken: vi.fn(async () => "code-1"),
}));
vi.mock("@/core/hooks/use-active-username", () => ({ useActiveUsername: () => state.username }));
vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: () => ({ activeUser: { username: state.username }, account: null, isLoading: false }),
}));
vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: (s: unknown) => unknown) =>
    selector({ toggleUiProp: vi.fn(), activeUser: { username: state.username } }),
}));
vi.mock("@/features/shared/user-avatar", () => ({ UserAvatar: () => <span /> }));
vi.mock("@/features/shared/feedback", () => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/api/format-error", () => ({ formatError: (e: unknown) => [String(e), "common"] }));
vi.mock("@ui/modal", () => ({
  Modal: ({ show, children }: { show: boolean; children: React.ReactNode }) => (show ? <div role="dialog">{children}</div> : null),
  ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/api/sdk-mutations/use-curation-recommend-mutation", () => ({
  useCurationRecommendMutation: () => ({ isPending: false, mutateAsync: async () => ({ tx_id: "e".repeat(40) }) }),
}));

import { POPOVER_RECOMMENDER_LIMIT } from "@/features/curation-desk/consts";
import { CurationMarkBadges } from "@/features/curation-desk/curation-mark-badges";
import { CurationRecommendDialog } from "@/features/curation-desk/curation-recommend-btn";
import { resetRecommendFlowForTests } from "@/features/curation-desk/curation-recommend-flow";
import { resetRecommendStoreForTests } from "@/features/curation-desk/curation-recommend-store";
import { RecommenderChip, formatPrecision } from "@/features/curation-desk/curation-recommender";

function recommender(username: string, overrides: Partial<CurationRecommender> = {}): CurationRecommender {
  return {
    username,
    rep: 61,
    reason: "quality",
    at: "2026-09-05T11:00:00Z",
    has_meta: true,
    precision: 1.3,
    trusted: true,
    ...overrides,
  };
}

function stats(username: string, overrides: Record<string, unknown> = {}) {
  return {
    username,
    window_days: 90,
    recommended: 24,
    curated: 15,
    dismissed: 2,
    withdrawn: 1,
    precision: 1.3,
    trusted: true,
    computed_at: "2026-09-05T00:00:00Z",
    ...overrides,
  };
}

/** Lets the route 5 read resolve, then the scorecards it opens. */
async function flush() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

const badgeProps = {
  isRoster: false,
  reviewedByCursor: false,
  late: false,
  resurfaced: false,
  belowCursor: false,
  chronological: true,
};

/**
 * The scorecard is the incentive made visible. What matters mechanically is
 * that it costs nothing until someone asks for it: a page of rows must never
 * be a page of route 14 requests.
 */
describe("recommender scorecard and chip", () => {
  let router: ReturnType<typeof installFetchRouter>;
  const row = makeRow({
    post_id: 7,
    author: "alice",
    permlink: "morning-light",
    recommend_count: 3,
    unique_recommenders: 2,
    reco_no_meta_count: 1,
  });

  beforeEach(() => {
    state.username = "member1";
    resetRecommendFlowForTests();
    resetRecommendStoreForTests();
    router = installFetchRouter()
      .on(/curation-desk\/recommend-meta$/, () => jsonResponse({ ok: true }, 202))
      .on(/curation-desk\/recommender\/([a-z0-9.-]+)$/, (url) => stats(url.split("/").pop()!))
      .on(/curation-desk\/post\//, () =>
        makePost(row, {
          recommenders: [
            recommender("bob"),
            recommender("carol", { trusted: false, precision: 0.9 }),
          ],
        })
      );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("renders the badge on a row without asking for a post or a scorecard", () => {
    renderWithQueryClient(<CurationMarkBadges row={row} {...badgeProps} />);
    expect(screen.getByText("curation-desk.reco.badge")).toBeInTheDocument();
    expect(router.callsTo(/curation-desk\/post\//)).toHaveLength(0);
    expect(router.callsTo(/curation-desk\/recommender\//)).toHaveLength(0);
  });

  it("loads the recommenders and their scorecards only once the popover opens", async () => {
    renderWithQueryClient(<CurationMarkBadges row={row} {...badgeProps} />);
    const button = screen.getByLabelText("curation-desk.reco.who");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await act(async () => {
      fireEvent.click(button);
    });
    await flush();

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(router.callsTo(/curation-desk\/post\/alice\/morning-light$/)).toHaveLength(1);
    const asked = router.callsTo(/curation-desk\/recommender\//).map((c) => c.url.split("/").pop());
    expect(asked.sort()).toEqual(["bob", "carol"]);
    expect(screen.getAllByText("curation-desk.scorecard.weight").length).toBe(2);
    // The chip is status, so it renders for the trusted recommender only.
    expect(screen.getAllByText("curation-desk.scorecard.trusted")).toHaveLength(1);
  });

  it("closes the popover again and asks for nothing more", async () => {
    renderWithQueryClient(<CurationMarkBadges row={row} {...badgeProps} />);
    const button = screen.getByLabelText("curation-desk.reco.who");
    await act(async () => {
      fireEvent.click(button);
    });
    await flush();
    const before = router.callsTo(/curation-desk\/recommender\//).length;
    await act(async () => {
      fireEvent.click(button);
    });
    await flush();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("curation-desk.scorecard.weight")).toBeNull();
    expect(router.callsTo(/curation-desk\/recommender\//)).toHaveLength(before);
  });

  it("closes on a real press of the open badge, on a press elsewhere, and on Escape from the trigger", async () => {
    renderWithQueryClient(<CurationMarkBadges row={row} {...badgeProps} />);
    const button = screen.getByLabelText("curation-desk.reco.who");
    const open = async () => {
      await act(async () => {
        fireEvent.click(button);
      });
      await flush();
      expect(button).toHaveAttribute("aria-expanded", "true");
    };

    // A pointer press is a mousedown and then a click. The click-away listens
    // to the mousedown; the trigger's own press must not count as "away", or
    // the click that follows reopens what the press just closed.
    // Two events, two turns: in a browser the close from the mousedown has
    // rendered before the click arrives.
    await open();
    await act(async () => {
      fireEvent.mouseDown(button);
    });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(button).toHaveAttribute("aria-expanded", "false");

    // A press anywhere else closes it.
    await open();
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    expect(button).toHaveAttribute("aria-expanded", "false");

    // Focus stays on the trigger after opening, so that is where Escape lands;
    // it closes the popover and goes no further (the desk keyboard map would
    // close the drawer under it).
    await open();
    const reachedDocument = vi.fn();
    document.addEventListener("keydown", reachedDocument);
    await act(async () => {
      fireEvent.keyDown(button, { key: "Escape" });
    });
    document.removeEventListener("keydown", reachedDocument);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(reachedDocument).not.toHaveBeenCalled();
  });

  it("floats the panel outside the badge's own subtree, so no overflow-hidden row clips it", async () => {
    renderWithQueryClient(<CurationMarkBadges row={row} {...badgeProps} />);
    const button = screen.getByLabelText("curation-desk.reco.who");
    await act(async () => {
      fireEvent.click(button);
    });
    await flush();
    const panel = screen.getByRole("group", { name: "curation-desk.reco.who" });
    expect(button.parentElement?.contains(panel)).toBe(false);
    expect(document.body.contains(panel)).toBe(true);
  });

  it("caps the recommenders it lists, so one open costs a bounded number of requests", async () => {
    const many = Array.from({ length: POPOVER_RECOMMENDER_LIMIT + 3 }, (_, i) => recommender(`rec${i}00`));
    router.on(/curation-desk\/post\//, () => makePost(row, { recommenders: many }));
    renderWithQueryClient(<CurationMarkBadges row={row} {...badgeProps} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("curation-desk.reco.who"));
    });
    await flush();

    expect(router.callsTo(/curation-desk\/recommender\//)).toHaveLength(POPOVER_RECOMMENDER_LIMIT);
    expect(screen.getByText("curation-desk.reco.more")).toBeInTheDocument();
  });

  it("shows the viewer their own record with the incentive when the reason dialog opens", async () => {
    renderWithQueryClient(<CurationRecommendDialog author="alice" permlink="morning-light" onHide={vi.fn()} />);

    await flush();

    expect(router.callsTo(/curation-desk\/recommender\/member1$/)).toHaveLength(1);
    expect(screen.getByText("curation-desk.scorecard.yours")).toBeInTheDocument();
    expect(screen.getByText("curation-desk.scorecard.incentive")).toBeInTheDocument();
  });

  it("renders the trusted chip for a trusted recommender only", () => {
    const { container, rerender } = renderWithQueryClient(<RecommenderChip trusted />);
    expect(screen.getByText("curation-desk.scorecard.trusted")).toBeInTheDocument();
    rerender(<RecommenderChip trusted={false} />);
    expect(container.textContent).toBe("");
  });

  it("prints a weight without a trailing zero", () => {
    expect(formatPrecision(1.3)).toBe("1.3");
    expect(formatPrecision(1)).toBe("1");
    expect(formatPrecision(1.25)).toBe("1.25");
    expect(formatPrecision(0.5)).toBe("0.5");
  });
});
