import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EntryRenderBoundary } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-render-boundary";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(() => "evt-456")
}));

// The report dialog is lazy-loaded (next/dynamic, ssr:false) and only matters
// once the user clicks Report. Stub next/dynamic to a no-op so the test doesn't
// pull the modal/form/react-query chain into the happy/error path.
vi.mock("next/dynamic", () => ({
  default: () => () => null
}));

function Boom(): never {
  throw new Error("kaboom");
}

describe("EntryRenderBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when nothing throws", () => {
    render(
      <EntryRenderBoundary>
        <div>post body</div>
      </EntryRenderBoundary>
    );

    expect(screen.getByText("post body")).toBeInTheDocument();
  });

  it("shows the inline retry card when a child throws", () => {
    render(
      <EntryRenderBoundary>
        <Boom />
      </EntryRenderBoundary>
    );

    // i18next is mocked to echo the key (see setup-any-spec.ts).
    expect(screen.getByText("entry.unable-to-load")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "g.try-again" })).toBeInTheDocument();
  });
});
