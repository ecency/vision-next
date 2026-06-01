"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import i18next from "i18next";
import { Button } from "@ui/button";
// Direct path (not the barrel) so the eager route bundle can't pull the report
// dialog in transitively — mirrors EntryRenderBoundary.
import { SentryErrorBoundary } from "@/features/issue-reporter/sentry-error-boundary";

// The report dialog (modal + form + react-query provider) is only needed once a
// crash has happened, so lazy-load it from the fallback. Keeps it out of the
// /discover first-load bundle on the happy path.
const SentryIssueReporterDialog = dynamic(
  () =>
    import("@/features/issue-reporter/sentry-issue-reporter-dialog").then((m) => ({
      default: m.SentryIssueReporterDialog
    })),
  { ssr: false }
);

interface Props {
  children: ReactNode;
}

/**
 * Wraps a single /discover widget (leaderboard, curation, contributors,
 * communities) so a render-time crash in that widget degrades to an inline
 * retry card instead of bubbling to the full-page 500 (global-error). (A
 * translator-induced commit-phase NotFoundError escapes nested boundaries — the
 * global translate-dom-guard handles that one; this is defense in depth for the
 * rest: data errors, undefined-component crashes, etc.)
 *
 * /discover has no route-segment error boundary, and its widgets are parallel-
 * route slots — a segment-level `error.tsx` only wraps the page (`children`)
 * slot, not the named `@leaderboard`/`@curation`/... slots — so the boundary is
 * applied per slot in the layout instead. On the happy path SentryErrorBoundary
 * renders `children` directly (no wrapper element), so the grid layout is
 * unchanged. Reports to Sentry with the React component stack.
 */
export function DiscoverRenderBoundary({ children }: Props) {
  return (
    <SentryErrorBoundary
      fallback={({ error, eventId, reset }) => (
        <div className="my-6 rounded-2xl border border-[--border-color] p-6 text-center">
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {i18next.t("global-error.description")}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button onClick={reset}>{i18next.t("g.try-again")}</Button>
            <SentryIssueReporterDialog error={error} eventId={eventId} />
          </div>
        </div>
      )}
    >
      {children}
    </SentryErrorBoundary>
  );
}
