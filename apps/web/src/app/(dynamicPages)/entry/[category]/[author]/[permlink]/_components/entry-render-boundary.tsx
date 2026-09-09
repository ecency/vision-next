"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import i18next from "i18next";
import { Button } from "@ui/button";
// Import the boundary from its direct path (not the barrel) so the eager path
// can't pull the report dialog in transitively.
import { SentryErrorBoundary } from "@/features/issue-reporter/sentry-error-boundary";

// The report dialog (modal + form + react-query provider) is only needed once a
// crash has happened, so lazy-load it from the fallback. This keeps it out of
// the entry page's first-load bundle on the happy path — zero added cost unless
// the boundary actually catches.
const SentryIssueReporterDialog = dynamic(
  () =>
    import("@/features/issue-reporter/sentry-issue-reporter-dialog").then((m) => ({
      default: m.SentryIssueReporterDialog
    })),
  { ssr: false }
);

interface EntryRenderBoundaryProps {
  children: ReactNode;
}

/**
 * Wraps the entry (post / reply) content so a CLIENT-side render crash in the
 * body, client content or discussion subtree degrades to an inline retry card
 * instead of bubbling to the full-page 500 (global-error) — and, crucially,
 * reports the error to Sentry WITH the React component stack so the failing
 * component is named. Lives as a client component because `fallback` is a
 * function, which can't cross the server→client (RSC) boundary from the server
 * page.
 *
 * Server-side crashes are NOT contained here: React's server renderer never
 * runs class error boundaries and only contains errors at Suspense boundaries.
 * The entry route deliberately has none above the post body (see the comment
 * in page.tsx), so a throw in the RSC/SSR render of this subtree is a full-page
 * 500. While loading.tsx existed its pending boundary happened to catch those
 * and the client retry landed here; that was incidental, not designed.
 */
export function EntryRenderBoundary({ children }: EntryRenderBoundaryProps) {
  return (
    <SentryErrorBoundary
      fallback={({ error, eventId, reset }) => (
        <div className="my-6 rounded-2xl border border-[--border-color] p-6 text-center">
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {i18next.t("entry.unable-to-load")}
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
