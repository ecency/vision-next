import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RouteErrorBoundary } from "@/features/issue-reporter/route-error-boundary";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(() => "evt-789"),
  flush: vi.fn(() => Promise.resolve(true))
}));

// The report dialog is lazy-loaded (next/dynamic, ssr:false). Stub it so the test
// doesn't pull the modal/form/react-query chain in.
vi.mock("next/dynamic", () => ({
  default: () => () => null
}));

function Boom(): never {
  throw new Error("kaboom");
}

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when nothing throws", () => {
    render(
      <RouteErrorBoundary>
        <div>route content</div>
      </RouteErrorBoundary>
    );

    expect(screen.getByText("route content")).toBeInTheDocument();
  });

  it("shows the inline retry card on a render crash (and reports with component stack)", () => {
    render(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>
    );

    // i18next is mocked to echo the key (see setup-any-spec.ts).
    expect(screen.getByText("global-error.description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "g.try-again" })).toBeInTheDocument();
  });
});
