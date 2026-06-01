"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import i18next from "i18next";
import { Button } from "@ui/button";
import { SentryErrorBoundary } from "@/features/issue-reporter/sentry-error-boundary";

// The report dialog is only needed once a crash has happened — lazy-load it so it
// stays out of the route's first-load bundle (zero added cost on the happy path).
const SentryIssueReporterDialog = dynamic(
  () =>
    import("@/features/issue-reporter/sentry-issue-reporter-dialog").then((m) => ({
      default: m.SentryIssueReporterDialog
    })),
  { ssr: false }
);

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Generic route-level error boundary. Reports render-time crashes to Sentry WITH
 * the React component stack (so the failing component is named — see
 * `SentryErrorBoundary`) and degrades to an inline retry card instead of the
 * full-page 500. Use it to wrap routes whose crashes currently escape uncaught
 * (no boundary => `mechanism: onerror`/`instrument`, no componentStack), e.g.
 * /submit (ECENCY-NEXT-DAM) and /waves (ECENCY-NEXT-1CSW).
 *
 * Client component because `fallback` is a function and can't cross the
 * server→client (RSC) boundary from a server page.
 */
export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps) {
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
