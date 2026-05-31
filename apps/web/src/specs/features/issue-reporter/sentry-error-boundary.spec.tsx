import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as Sentry from "@sentry/nextjs";
import { SentryErrorBoundary } from "@/features/issue-reporter/sentry-error-boundary";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(() => "evt-123")
}));

// A child whose throwing is toggleable, so we can exercise reset/recovery.
let shouldThrow = true;
function Maybe() {
  if (shouldThrow) {
    throw new Error("boom");
  }
  return <div>recovered child</div>;
}

const fallback = ({ eventId, reset }: { error: Error; eventId?: string; reset: () => void }) => (
  <div>
    <span data-testid="fallback">fallback:{eventId ?? "none"}</span>
    <button onClick={reset}>retry</button>
  </div>
);

describe("SentryErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldThrow = true;
    // React logs caught boundary errors to console.error; silence the noise.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when nothing throws", () => {
    render(
      <SentryErrorBoundary fallback={fallback}>
        <div>safe child</div>
      </SentryErrorBoundary>
    );

    expect(screen.getByText("safe child")).toBeInTheDocument();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("renders the fallback and reports with the React component stack on throw", () => {
    render(
      <SentryErrorBoundary fallback={fallback}>
        <Maybe />
      </SentryErrorBoundary>
    );

    // Fallback is shown instead of the crashed subtree.
    expect(screen.getByTestId("fallback")).toBeInTheDocument();

    // Reported once, WITH the component stack attached (the part source maps
    // alone can't provide for undefined-component crashes).
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: { react: { componentStack: expect.any(String) } }
      })
    );

    // The captured event id is threaded into the fallback (for feedback assoc).
    expect(screen.getByTestId("fallback")).toHaveTextContent("fallback:evt-123");
  });

  it("restores children when reset is called after the child stops throwing", () => {
    render(
      <SentryErrorBoundary fallback={fallback}>
        <Maybe />
      </SentryErrorBoundary>
    );

    expect(screen.getByTestId("fallback")).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "retry" }));

    expect(screen.getByText("recovered child")).toBeInTheDocument();
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
  });
});
