import { vi } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PointsActionCard } from "@/app/perks/points/_components/points-action-card";

// next/image needs a loader in the test env; render a plain img instead.
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />
}));

describe("PointsActionCard", () => {
  const baseProps = {
    imageSrc: "/x.svg",
    title: "Buy with HIVE",
    description: "Swap HIVE/HBD to POINTS",
    buttonText: "Buy",
    onClick: vi.fn()
  };

  beforeEach(() => vi.clearAllMocks());

  test("renders the numbered steps as list items when provided", () => {
    render(
      <PointsActionCard {...baseProps} steps={["First step", "Second step", "Third step"]} />
    );

    expect(screen.getByText("First step")).toBeInTheDocument();
    expect(screen.getByText("Second step")).toBeInTheDocument();
    expect(screen.getByText("Third step")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  test("renders no steps list when steps is omitted or empty", () => {
    const { rerender } = render(<PointsActionCard {...baseProps} />);
    expect(screen.queryByRole("listitem")).toBeNull();

    rerender(<PointsActionCard {...baseProps} steps={[]} />);
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  test("fires onClick when the action button is pressed", () => {
    const onClick = vi.fn();
    render(<PointsActionCard {...baseProps} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
