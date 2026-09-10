import React from "react";
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The signal the cached repaint runs on: which feed a soft navigation is going
// to, while it is going there (#1789). Two halves are tested here — the store,
// and the desktop tab bar's `useLinkStatus` probe that feeds it.

const status = vi.hoisted(() => ({ value: { pending: false } }));

// The probe has to live inside a <Link> to see anything, so the hook is the
// seam. The default export is reduced to its children; this file is about the
// probe, and specs/app/feed/feed-navigation-announce.spec.tsx is the one that
// checks the probe is really nested inside the anchor.
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLinkStatus: () => status.value
}));

import { FeedLinkPendingProbe } from "@/app/(dynamicPages)/feed/_components/feed-link-pending-probe";
import {
  clearFeedNavigationTarget,
  resetFeedNavigationTarget,
  setFeedNavigationTarget,
  useFeedNavigationTarget,
  type FeedNavigationTarget
} from "@/app/(dynamicPages)/feed/_components/feed-navigation-intent";

const HOT: FeedNavigationTarget = { filter: "hot", tag: "photography", noReblog: false };
const TRENDING: FeedNavigationTarget = { filter: "trending", tag: "", noReblog: false };

function Readout() {
  const target = useFeedNavigationTarget();
  return (
    <div data-testid="target">
      {target ? `${target.filter}|${target.tag}|${target.noReblog}` : "none"}
    </div>
  );
}

function readout() {
  return screen.getByTestId("target").textContent;
}

describe("feed navigation intent", () => {
  beforeEach(() => {
    status.value = { pending: false };
  });

  afterEach(() => {
    act(() => resetFeedNavigationTarget());
  });

  it("holds nothing until a navigation starts", () => {
    render(<Readout />);

    expect(readout()).toBe("none");
  });

  it("publishes the target a navigation is heading to", () => {
    render(<Readout />);

    act(() => setFeedNavigationTarget(HOT));

    expect(readout()).toBe("hot|photography|false");
  });

  // React runs every effect cleanup in a commit before every effect, so when a
  // reader clicks a second tab mid-navigation the tab that STOPPED being
  // pending tears down after the tab that started has already been recorded.
  // An unconditional clear there would erase the navigation actually in flight
  // and the reader would be left looking at the previous page for no reason.
  it("ignores a clear from a navigation that is no longer the current one", () => {
    render(<Readout />);

    act(() => setFeedNavigationTarget(HOT));
    act(() => setFeedNavigationTarget(TRENDING));
    act(() => clearFeedNavigationTarget(HOT));

    expect(readout()).toBe("trending||false");
  });

  it("clears when the navigation that set it finishes", () => {
    render(<Readout />);

    act(() => setFeedNavigationTarget(HOT));
    expect(readout()).toBe("hot|photography|false");

    act(() => clearFeedNavigationTarget({ ...HOT }));

    expect(readout()).toBe("none");
  });

  describe("per-link probe", () => {
    it("publishes its own target while its link is pending", () => {
      status.value = { pending: true };

      render(
        <>
          <FeedLinkPendingProbe target={HOT} />
          <Readout />
        </>
      );

      expect(readout()).toBe("hot|photography|false");
    });

    it("publishes nothing while its link is idle", () => {
      render(
        <>
          <FeedLinkPendingProbe target={HOT} />
          <Readout />
        </>
      );

      expect(readout()).toBe("none");
    });

    it("clears when its link stops being pending", () => {
      status.value = { pending: true };

      const { rerender } = render(
        <>
          <FeedLinkPendingProbe target={HOT} />
          <Readout />
        </>
      );
      expect(readout()).toBe("hot|photography|false");

      status.value = { pending: false };
      rerender(
        <>
          <FeedLinkPendingProbe target={HOT} />
          <Readout />
        </>
      );

      expect(readout()).toBe("none");
    });

    it("renders no DOM of its own", () => {
      status.value = { pending: true };

      const { container } = render(<FeedLinkPendingProbe target={HOT} />);

      expect(container.innerHTML).toBe("");
    });
  });
});
