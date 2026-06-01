"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { isDeploySkewError, reloadForSkew } from "@/features/pwa-install/service-worker-recovery";

interface FallbackProps {
  error: Error;
  // Sentry event id of the captured exception, so the fallback can attach user
  // feedback to the SAME event (see SentryIssueReporterDialog).
  eventId?: string;
  reset: () => void;
}

interface Props {
  children: ReactNode;
  fallback: (props: FallbackProps) => ReactNode;
}

interface State {
  error?: Error;
  eventId?: string;
}

/**
 * Client error boundary that reports render-time throws to Sentry WITH the React
 * component stack attached. For "Element type is invalid" / undefined-component
 * errors the framework JS stack is entirely react-dom internals (0 app frames),
 * so the component stack is the only thing that names the component at fault —
 * `captureException` alone (e.g. from global-error, which only receives
 * `{ error }`) cannot. Pair with the uploaded source maps to pinpoint the file.
 *
 * Lifecycle note: `getDerivedStateFromError` renders the fallback first with
 * `eventId` still undefined, then `componentDidCatch` captures the exception and
 * sets `eventId` on a second render. A fallback that auto-opens the report
 * dialog must therefore guard on `eventId` to avoid capturing a duplicate
 * exception; the current entry fallback only reports on explicit click, so it
 * is unaffected.
 */
export class SentryErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // A deploy-skew crash (a chunk that no longer matches the running build) is
    // auto-recovered by reloading. Record it as a distinct, low-severity
    // "auto-recovered" event (so skew frequency stays visible) instead of a
    // fresh crash that re-spikes after every deploy, then reload — skip the
    // component-stack capture, which is only useful for real render bugs.
    if (isDeploySkewError(error)) {
      Sentry.captureException(error, {
        level: "warning",
        tags: { deploy_skew: "true" },
        fingerprint: ["deploy-skew-auto-recovered"]
      });
      reloadForSkew();
      return;
    }
    const eventId = Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack ?? undefined } }
    });
    this.setState({ eventId });
  }

  reset = () => this.setState({ error: undefined, eventId: undefined });

  render() {
    const { error, eventId } = this.state;
    if (error) {
      return this.props.fallback({ error, eventId, reset: this.reset });
    }
    return this.props.children;
  }
}
