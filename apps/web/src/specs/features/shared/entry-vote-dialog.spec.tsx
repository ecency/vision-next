import { vi } from "vitest";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient, mockEntry } from "@/specs/test-utils";

// The RC pre-check banner pulls in its own SDK/mutation chain we don't exercise here.
vi.mock("@/features/shared/rc-precheck", () => ({
  RcPrecheckBanner: () => null
}));

// FormattedCurrency formats via formattedNumber from the globally-mocked @/utils;
// stub it (the @/features/shared barrel re-export resolves to this module).
vi.mock("@/features/shared/formatted-currency", () => ({
  FormattedCurrency: ({ value }: { value: number }) => <span>{value}</span>
}));

import { EntryVoteDialog } from "@/features/shared/entry-vote-btn/entry-vote-dialog";

function renderDialog(previousVotedValue: number | undefined) {
  const entry = mockEntry({ author: "bob", permlink: "p", post_id: 7, is_paidout: false });
  const props = {
    entry,
    account: undefined,
    upVoted: true,
    downVoted: false,
    isPostSlider: true,
    previousVotedValue,
    setTipDialogMounted: vi.fn(),
    onClick: vi.fn(),
    handleClickAway: vi.fn(),
    isVoted: { upVoted: true, downVoted: false },
    isVotingLoading: false
  };
  const utils = renderWithQueryClient(<EntryVoteDialog {...props} />);
  const rerender = (next: number | undefined) =>
    utils.rerender(<EntryVoteDialog {...props} previousVotedValue={next} />);
  return { ...utils, rerender };
}

describe("EntryVoteDialog — applying a late previous-vote value", () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => vi.clearAllMocks());

  it("syncs the slider to the previous vote when it resolves after open (user has not touched it)", () => {
    const { rerender } = renderDialog(undefined);

    const slider = screen.getByRole("slider");
    // Opens at the default fallback weight (100%) before the previous vote loads.
    expect(slider).toHaveAttribute("aria-valuenow", "100");

    // The prior vote (40%) arrives in the background.
    rerender(40);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");
  });

  it("does NOT override a weight the user already started adjusting while it loaded", () => {
    const { rerender } = renderDialog(undefined);

    const slider = screen.getByRole("slider");
    // The user grabs the slider (genuine pointer input) and sets 65% before the fetch resolves.
    fireEvent.mouseDown(slider);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "65" } });
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "65");

    // The late prior vote (40%) must not clobber the user's in-progress choice.
    rerender(40);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "65");
  });
});
