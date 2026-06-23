"use client";

import { Component, ReactNode } from "react";
import dynamic from "next/dynamic";
import i18next from "i18next";

function TweetFallback({ id }: { id: string }) {
  return (
    <div className="er-twitter-fallback my-2 rounded-lg border border-[--border-color] p-4 text-center text-sm text-gray-600 dark:text-gray-400">
      {i18next.t("tweet.load-failed")}{" "}
      <a
        className="text-blue-500 hover:underline"
        href={`https://x.com/i/status/${id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {i18next.t("tweet.view-on-x")}
      </a>
    </div>
  );
}

// Lazy-load react-tweet's client component. The .catch only covers chunk-load
// failures (network / CDN / iOS Safari strict policies) — render-time throws are
// handled by the error boundary below.
const Tweet = dynamic<{ id: string }>(
  () =>
    import("react-tweet")
      .then((m) => ({ default: m.Tweet }))
      .catch((error) => {
        console.error("Failed to load react-tweet component:", error);
        return { default: TweetFallback };
      }),
  { ssr: false }
);

interface BoundaryProps {
  id: string;
  children: ReactNode;
}

class TweetErrorBoundary extends Component<BoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Expected, handled case — not a crash: react-tweet throws inside its own
    // render when X's syndication payload is incomplete (the tweet is deleted /
    // protected / age-restricted, or a field it iterates is absent). We already
    // degrade to a "view on X" link, so log a single quiet warning instead of an
    // error + component stack that looks like a real failure (and inflates Sentry).
    console.warn(`[SafeTweet] tweet ${this.props.id} unavailable; showing fallback link (${error.message})`);
  }

  render() {
    return this.state.hasError ? <TweetFallback id={this.props.id} /> : this.props.children;
  }
}

/**
 * Drop-in for react-tweet's `<Tweet>`: lazy-loads it (with a chunk-load
 * fallback) and wraps it in an error boundary so a render-time throw shows a
 * fallback link instead of breaking the surrounding post. Used as the
 * renderer's `TwitterComponent` and in post enhancements.
 */
export function SafeTweet({ id }: { id: string }) {
  return (
    <TweetErrorBoundary key={id} id={id}>
      <Tweet id={id} />
    </TweetErrorBoundary>
  );
}
