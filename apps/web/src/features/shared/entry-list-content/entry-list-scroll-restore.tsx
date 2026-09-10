"use client";

import { useEffect } from "react";

/**
 * Puts the reader back on the card they left through.
 *
 * Restores by ELEMENT, not by pixel offset. A feed remounts with only its first
 * page rendered, so the document is shorter than it was when the reader left and
 * a remembered `scrollY` lands somewhere arbitrary — further off the more the
 * reader had scrolled, which is exactly when they care. An element is where it
 * is regardless of what came before it.
 *
 * The card ids this depends on are `author-permlink` from the card's own post
 * (see entry-list-item), so they survive a re-render and cannot collide with a
 * cross-post's original.
 *
 * Cheap by construction: one delegated listener while a list is mounted, one
 * sessionStorage read on mount, and nothing at all for a reader who has not
 * clicked into a post.
 */
const STORAGE_KEY = "ecency:entry-list-anchor";

/** Long enough for reading a post and coming back, short enough not to surprise. */
const MAX_AGE_MS = 30 * 60 * 1000;

/**
 * How long to keep watching for the card after the list mounts. Past this the
 * reader has been looking at the top of the feed for long enough that yanking
 * them somewhere else is worse than not restoring at all.
 */
const RESTORE_WINDOW_MS = 3000;

interface Anchor {
  url: string;
  id: string;
  at: number;
}

function currentUrl() {
  return `${window.location.pathname}${window.location.search}`;
}

export function EntryListScrollRestore() {
  // Remember the card the reader leaves through. Capture phase, because the
  // card's own link handler navigates and this must run first.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest?.(".entry-list-item[id]") as HTMLElement | null;

      if (!card?.id) {
        return;
      }

      try {
        const anchor: Anchor = { url: currentUrl(), id: card.id, at: Date.now() };
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(anchor));
      } catch (e) {
        // Private mode, quota, storage disabled: losing the anchor costs a
        // scroll position, so it must never cost the click.
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // ...and go back to it, once, on the list this anchor was taken from.
  useEffect(() => {
    let anchor: Anchor | null = null;

    try {
      anchor = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      return;
    }

    if (!anchor?.id || anchor.url !== currentUrl() || Date.now() - anchor.at > MAX_AGE_MS) {
      return;
    }

    const scrollToAnchor = () => {
      const el = document.getElementById(anchor!.id);

      if (!el) {
        return false;
      }

      // No smooth behaviour: this is a restore, not a journey. Landing there is
      // the point, and an animated scroll on arrival reads as a glitch.
      el.scrollIntoView({ block: "center" });
      return true;
    };

    if (scrollToAnchor()) {
      return;
    }

    // The card is normally in the SSR shell already, so the line above wins. It
    // does not when the list arrives with hydration, or when a slow page pushes
    // the card in later — so watch for it instead of taking one timed guess and
    // giving up. Bounded: the observer stops at the first match or at the
    // deadline, whichever comes first, and a card on a page the reader has not
    // loaded yet never appears at all.
    const observer = new MutationObserver(() => {
      if (scrollToAnchor()) {
        observer.disconnect();
        clearTimeout(deadline);
      }
    });

    const deadline = setTimeout(() => observer.disconnect(), RESTORE_WINDOW_MS);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearTimeout(deadline);
    };
  }, []);

  return null;
}
