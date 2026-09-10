"use client";

import { useEffect } from "react";
import { useLinkStatus } from "next/link";
import {
  clearFeedNavigationTarget,
  setFeedNavigationTarget,
  type FeedNavigationTarget
} from "./feed-navigation-intent";

interface Props {
  target: FeedNavigationTarget;
}

/**
 * Reports its enclosing `<Link>`'s pending state to the feed navigation store.
 *
 * `useLinkStatus` only works inside a `<Link>`, which is why this is a
 * component rendered as one of the tab's children rather than a hook the tab
 * calls: the tab bar renders one of these per tab and each knows its own
 * destination, so the store learns WHICH feed is in flight, not merely that
 * something is.
 *
 * Renders null. That matters beyond tidiness: the tab bar is part of the feed
 * route's SSR shell, and the whole point of #1786 was that nothing above the
 * cards may add markup, a boundary, or a hydration mismatch. Pinned by
 * specs/app/feed/feed-cached-repaint-ssr.spec.tsx.
 *
 * On a dynamic route with no `loading.tsx`, Next prefetches nothing for these
 * links, so `pending` covers the entire round trip — which is exactly the
 * window the repaint exists to fill.
 */
export function FeedLinkPendingProbe({ target }: Props) {
  const { pending } = useLinkStatus();
  const { filter, tag, noReblog } = target;

  useEffect(() => {
    if (!pending) {
      return;
    }

    // Rebuilt from the primitives rather than captured, so the effect's
    // identity check on teardown compares the same value it announced even if
    // the parent re-rendered with a new object in between.
    const announced = { filter, tag, noReblog };
    setFeedNavigationTarget(announced);
    return () => clearFeedNavigationTarget(announced);
  }, [pending, filter, tag, noReblog]);

  return null;
}
