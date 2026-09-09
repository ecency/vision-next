import React from "react";
import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "@/specs/test-utils";
import { makeRow, rowWindowProps } from "./curation-test-utils";

vi.mock("@ecency/sdk", async () => ({ ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")) }));
vi.mock("@/utils", async () => ({ ...(await vi.importActual<Record<string, unknown>>("@/utils")) }));
vi.mock("@/core/hooks/use-active-username", () => ({ useActiveUsername: () => "member1" }));
vi.mock("@/core/hooks/use-active-account", () => ({ useActiveAccount: () => ({ activeUser: { username: "member1" }, account: null }) }));
vi.mock("@/core/global-store", () => ({ useGlobalStore: (selector: (s: unknown) => unknown) => selector({ toggleUiProp: vi.fn(), activeUser: { username: "member1" } }) }));
vi.mock("@/features/shared/profile-popover", () => ({ ProfilePopover: ({ entry }: { entry: { author: string } }) => <span>@{entry.author}</span> }));
vi.mock("@/features/shared/user-avatar", () => ({ UserAvatar: () => <span /> }));
vi.mock("@/features/shared/feedback", () => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/api/format-error", () => ({ formatError: (e: unknown) => [String(e), "common"] }));
vi.mock("@/api/sdk-mutations/use-curation-recommend-mutation", () => ({ useCurationRecommendMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }));

import { Chip } from "@/features/curation-desk/curation-chip";
import { appLabel } from "@/features/curation-desk/curation-queue-display";
import { CurationQueueRow } from "@/features/curation-desk/curation-queue-row";
import type { DeskRow } from "@/features/curation-desk/types";

// RowActions.onVote is required and tsconfig excludes **/*.spec.tsx, so leaving it
// out type-checks clean and only fails when something clicks the vote button.
const actions = {
  onSelect: vi.fn(), onOpen: vi.fn(), onVote: vi.fn(), onReviewed: vi.fn(),
  onSnooze: vi.fn(), onFlag: vi.fn(), onNote: vi.fn(), onClearMark: vi.fn(),
};

function renderRow(row: DeskRow, isActive = false) {
  return renderWithQueryClient(
    <CurationQueueRow row={row} isActive={isActive} isRoster={false} isTrial={false} username="member1"
      recommendationsEnabled tapToOpen={false} section="queue" late={false} resurfaced={false} belowCursor={false}
      reviewedByCursor={false} chronological {...rowWindowProps(row)} {...actions} />
  );
}

const marks = () => screen.queryAllByRole("img", { name: "waves.source-ecency" });
const globes = () => screen.queryAllByRole("img", { name: /source-app|app-unknown/ });
// The Ecency mark is the svg itself; the globe's name sits on its wrapper. Both are
// inside the thumbnail's pill when the thumbnail is the one carrying them.
const onThumbnail = (els = marks()) => els.filter((m) => m.closest(".absolute") !== null);
const inByline = (els = marks()) => els.filter((m) => m.closest(".absolute") === null);

describe("Ecency source mark on a desk row", () => {
  // jsdom has no breakpoints, so the responsive half is asserted through the class the
  // row applies, not through what is painted.
  it("puts the mark on the thumbnail at every width and hides the byline copy", () => {
    // A row with a cover shows the (smaller) thumbnail on phones too, so the byline
    // copy is redundant everywhere.
    renderRow(makeRow({ post_id: 1, is_ecency: true, first_image: "https://img.example/cover.jpg" }));
    expect(onThumbnail()).toHaveLength(1);
    expect(onThumbnail()[0].closest(".absolute")!.parentElement!.classList).not.toContain("hidden");
    expect(inByline()).toHaveLength(1);
    expect(inByline()[0].classList).toContain("hidden");
    expect(inByline()[0].classList).not.toContain("sm:hidden");
  });

  it("keeps the thumbnail mark on a post with no cover image, with the byline copy below sm", () => {
    // Without a cover the placeholder box only renders from sm up, so phones read the
    // mark from the byline instead.
    renderRow(makeRow({ post_id: 2, is_ecency: true, first_image: null }));
    expect(onThumbnail()).toHaveLength(1);
    expect(onThumbnail()[0].closest(".absolute")!.parentElement!.classList).toContain("hidden");
    expect(onThumbnail()[0].closest(".absolute")!.parentElement!.classList).toContain("sm:block");
    expect(inByline()).toHaveLength(1);
    expect(inByline()[0].getAttribute("class")).toContain("sm:hidden");
  });

  it("carries the mark in the byline at every width when the row is collapsed", () => {
    // A curated row that is not active renders no thumbnail block at all, so the byline
    // copy is the only one and must not be hidden above sm.
    renderRow(makeRow({ post_id: 3, is_ecency: true, state: 1 }));
    expect(onThumbnail()).toHaveLength(0);
    expect(inByline()).toHaveLength(1);
    expect(inByline()[0].getAttribute("class")).not.toContain("sm:hidden");
  });

  it("draws the mark, not an empty frame, when the row says Ecency but the app string does not", () => {
    // The wrapper and the glyph are driven by one flag now. is_ecency cannot outrun the
    // app string today (app_source is itself derived from json_metadata->>'app'), but the
    // two used to be gated by different predicates, so widening is_ecency would have left
    // an empty circle on the thumbnail with the byline copy hidden above sm.
    renderRow(makeRow({ post_id: 5, is_ecency: true, app: null, first_image: "https://img.example/c.jpg" }));
    expect(onThumbnail()).toHaveLength(1);
    expect(inByline()).toHaveLength(1);
  });

  it("gives another front-end a globe and no app word", () => {
    renderRow(makeRow({ post_id: 4, is_ecency: false, app: "peakd/2025.1", first_image: "https://img.example/c.jpg" }));
    expect(marks()).toHaveLength(0);
    // The name is the tooltip now, not a chip in the byline.
    expect(screen.queryByText("peakd")).toBeNull();
    expect(onThumbnail(globes())).toHaveLength(1);
    expect(inByline(globes())).toHaveLength(1);
    expect(onThumbnail(globes())[0]).toHaveAttribute("title", "curation-desk.row.source-app");
  });

  it("falls back to the unknown-app name when the post declares no app", () => {
    renderRow(makeRow({ post_id: 6, is_ecency: false, app: null, first_image: "https://img.example/c.jpg" }));
    expect(globes()).toHaveLength(2);
    expect(onThumbnail(globes())[0]).toHaveAttribute("title", "curation-desk.row.app-unknown");
  });
});

describe("appLabel", () => {
  it("drops the version and anything after a hyphen", () => {
    expect(appLabel("peakd/2025.1")).toBe("peakd");
    expect(appLabel("ecency/4.4.2-vision")).toBe("ecency");
    expect(appLabel("ecency-mobile")).toBe("ecency");
    expect(appLabel(null)).toBe("");
  });
});

describe("Chip blue tone", () => {
  it("uses an ink that is legible on its own dark ground", () => {
    // blue-dark-sky-active on blue-dark-grey was 1.7:1; dark-sky-020 is 5.4:1. This tone
    // carries the Recommended chip on every row, so the regression would be invisible
    // to every test that only checks text.
    const { container } = renderWithQueryClient(<Chip tone="blue">recommended</Chip>);
    const cls = container.firstElementChild?.getAttribute("class") ?? "";
    expect(cls).toContain("dark:text-blue-dark-sky-020");
    expect(cls).not.toContain("dark:text-blue-dark-sky-active");
  });
});
