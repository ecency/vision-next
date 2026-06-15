import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("react-in-viewport", () => ({
  useInViewport: vi.fn()
}));

import { useInViewport } from "react-in-viewport";
import { HydrateOnVisible } from "@/features/shared/hydrate-on-visible";

const setInViewport = (v: boolean) => (useInViewport as any).mockReturnValue({ inViewport: v });

const Children = () => <span data-testid="children">real</span>;
const Placeholder = <span data-testid="placeholder">skeleton</span>;

describe("HydrateOnVisible", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the placeholder (not children) when off-screen", () => {
    setInViewport(false);
    render(
      <HydrateOnVisible placeholder={Placeholder}>
        <Children />
      </HydrateOnVisible>
    );
    expect(screen.getByTestId("placeholder")).toBeInTheDocument();
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });

  it("renders children immediately when disabled (above-the-fold)", () => {
    setInViewport(false);
    render(
      <HydrateOnVisible placeholder={Placeholder} disabled>
        <Children />
      </HydrateOnVisible>
    );
    expect(screen.getByTestId("children")).toBeInTheDocument();
    expect(screen.queryByTestId("placeholder")).not.toBeInTheDocument();
  });

  it("swaps to children once the element enters the viewport", async () => {
    setInViewport(true);
    render(
      <HydrateOnVisible placeholder={Placeholder}>
        <Children />
      </HydrateOnVisible>
    );
    await waitFor(() => expect(screen.getByTestId("children")).toBeInTheDocument());
    expect(screen.queryByTestId("placeholder")).not.toBeInTheDocument();
  });

  it("mounts children on touch (off-screen touch users)", async () => {
    setInViewport(false);
    const { container } = render(
      <HydrateOnVisible placeholder={Placeholder}>
        <Children />
      </HydrateOnVisible>
    );
    expect(screen.getByTestId("placeholder")).toBeInTheDocument();
    fireEvent.touchStart(container.firstChild as Element);
    await waitFor(() => expect(screen.getByTestId("children")).toBeInTheDocument());
  });
});
