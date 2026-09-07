import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient, mockEntry, setupModalContainers } from "@/specs/test-utils";

// LoginRequired only renders its (gated) children for a logged-in user.
vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: vi.fn(() => ({
    activeUser: { username: "alice" },
    username: "alice",
    account: null,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: true,
    error: null,
    refetch: vi.fn()
  }))
}));

// `@/utils` is globally mocked to only expose `random` + `getAccessToken`;
// EntryTipBtn's popover uses `formattedNumber`. Re-mock with importActual so the
// real helpers stay available while the globally stubbed ones remain stubbed.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<typeof import("@/utils")>("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// Tooltip + Popover are presentational wrappers here; render their content
// inline so the assertions don't depend on hover/portal behavior.
vi.mock("@ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>
}));
vi.mock("@/features/ui", () => ({
  Popover: ({ directContent, children }: any) => (
    <>
      {directContent}
      {children}
    </>
  ),
  PopoverContent: ({ children }: any) => <>{children}</>
}));

// The transfer dialog is loaded through next/dynamic; a stub that prints its
// props is enough to prove which dialog opened and with what.
vi.mock("next/dynamic", () => ({
  default: () =>
    function TransferStub(props: any) {
      return <div data-testid="transfer">{`${props.asset} ${props.to} ${props.memo}`}</div>;
    }
}));

import { EntryTipBtn } from "@/features/shared/entry-tip-btn";
import type { PostTipsResponse } from "@ecency/sdk";

describe("EntryTipBtn — feed-provided tip count + already-tipped state", () => {
  it("shows the feed-provided tip count without a postTips fetch", () => {
    const { container } = renderWithQueryClient(
      <EntryTipBtn entry={mockEntry as any} tipCount={3} />
    );
    expect(container.querySelector(".tip-count")?.textContent).toBe("3");
  });

  it("flags the button as already-tipped when tippedByViewer is set", () => {
    const { container } = renderWithQueryClient(
      <EntryTipBtn entry={mockEntry as any} tipCount={2} tippedByViewer={true} />
    );
    expect(container.querySelector(".inner-btn.tipped")).toBeTruthy();
  });

  it("shows 0 in the feed (parity with vote/comment counts) when tipCount is 0", () => {
    const { container } = renderWithQueryClient(
      <EntryTipBtn entry={mockEntry as any} tipCount={0} />
    );
    expect(container.querySelector(".tip-count")?.textContent).toBe("0");
    expect(container.querySelector(".inner-btn.tipped")).toBeFalsy();
  });

  it("renders no number outside the feed (no tipCount prop and no postTips)", () => {
    const { container } = renderWithQueryClient(<EntryTipBtn entry={mockEntry as any} />);
    expect(container.querySelector(".tip-count")?.textContent).toBe("");
  });

  it("prefers the full postTips breakdown count over the feed fallback", () => {
    const postTips: PostTipsResponse = {
      meta: { count: 5, totals: { POINT: 250 } },
      list: []
    };
    const { container } = renderWithQueryClient(
      <EntryTipBtn entry={mockEntry as any} postTips={postTips} tipCount={1} />
    );
    expect(container.querySelector(".tip-count")?.textContent).toBe("5");
  });
});

describe("EntryTipBtn — caller-drawn trigger", () => {
  beforeEach(setupModalContainers);

  it("opens the same tip dialog from a trigger the caller draws", async () => {
    const entry = mockEntry({ author: "alice", permlink: "morning-light" });
    renderWithQueryClient(
      <EntryTipBtn
        entry={entry}
        trigger={(open) => (
          <button type="button" onClick={open}>
            Send Points
          </button>
        )}
      />
    );
    // Only the trigger is drawn: no built-in gift button beside it.
    expect(document.querySelector(".entry-tip-btn")).toBeNull();
    expect(screen.queryByTestId("transfer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Send Points" }));
    const dialog = await screen.findByTestId("transfer");
    expect(dialog).toHaveTextContent("POINT alice Tip for @alice/morning-light");
  });
});
