"use client";

import { useSyncExternalStore } from "react";

/**
 * Which feed a client-side navigation is on its way to, while it is on its way.
 *
 * The feed route has no `loading.tsx` and no Suspense above the cards (#1786),
 * so React renders nothing at all during a soft navigation: the previous page
 * stays on screen until the RSC response lands. Nothing in the App Router
 * exposes "a navigation is in flight, and here is its target" — `usePathname`
 * only moves once it has landed, and `@bprogress`'s `useProgress()` is an
 * imperative start/stop handle with no pending flag and no URL — so the two
 * places that start a feed navigation report it here instead:
 *
 *  - the desktop tab bar, whose tabs are `<Link>`s, through `useLinkStatus`
 *    (see feed-link-pending-probe.tsx);
 *  - the mobile dropdown and the reblog toggle, which call `router.push`,
 *    through `useTransition` in the menu.
 *
 * A module singleton rather than a context: the reporter (the menu) and the
 * reader (the repaint, wrapping `{children}`) are siblings under the feed
 * layout, and a provider around both would be a second wrapper in the SSR tree
 * for no gain. It is safe on the server because nothing ever WRITES there —
 * every writer is an event handler or an effect — and `getServerSnapshot`
 * returns null unconditionally, so a server render can neither read nor leak a
 * value across requests.
 */
export interface FeedNavigationTarget {
  /** First URL segment: trending, hot, created, payout, muted, promoted, feed. */
  filter: string;
  /** Second segment: a tag, `my`, `@account`, or "" for the global feed. */
  tag: string;
  /** The destination's `?no-reblog=true`, which is a client-side filter. */
  noReblog: boolean;
}

let target: FeedNavigationTarget | null = null;
const listeners = new Set<() => void>();

function isSameTarget(a: FeedNavigationTarget | null, b: FeedNavigationTarget | null): boolean {
  if (a === b) {
    return true;
  }
  return (
    !!a && !!b && a.filter === b.filter && a.tag === b.tag && a.noReblog === b.noReblog
  );
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Announce that a navigation to `next` has started. */
export function setFeedNavigationTarget(next: FeedNavigationTarget): void {
  if (isSameTarget(target, next)) {
    return;
  }
  target = next;
  emit();
}

/**
 * Announce that the navigation to `finished` is over.
 *
 * Identity-checked rather than an unconditional clear: React runs every effect
 * cleanup in a commit before every effect, so the tab that stopped being
 * pending tears down after the tab that started has already been recorded when
 * a reader clicks a second tab mid-navigation. An unconditional clear there
 * would erase the target that is actually in flight.
 */
export function clearFeedNavigationTarget(finished: FeedNavigationTarget | null): void {
  if (!finished || !isSameTarget(target, finished)) {
    return;
  }
  target = null;
  emit();
}

/** Test seam. Nothing in the app calls this; a spec leaving state behind would leak into the next one. */
export function resetFeedNavigationTarget(): void {
  target = null;
  emit();
}

/** The feed a navigation is heading to, or null when nothing is in flight. */
export function useFeedNavigationTarget(): FeedNavigationTarget | null {
  return useSyncExternalStore(
    subscribe,
    // The module variable itself, never a derived object: a fresh object per
    // call makes React see a new snapshot on every render and loop.
    () => target,
    () => null
  );
}
