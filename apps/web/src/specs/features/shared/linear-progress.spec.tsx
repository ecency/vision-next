import { vi } from 'vitest';
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LinearProgress } from "@/features/shared/linear-progress";

describe("LinearProgress", () => {
  test("renders the linear progress component", () => {
    const { container } = render(<LinearProgress />);

    expect(container.querySelector(".linear-progress")).toBeInTheDocument();
  });

  test("renders two progress bars", () => {
    const { container } = render(<LinearProgress />);

    const bars = container.querySelectorAll(".bar");
    expect(bars).toHaveLength(2);
  });

  test("renders bar1 element", () => {
    const { container } = render(<LinearProgress />);

    const bar1 = container.querySelector(".bar1");
    expect(bar1).toBeInTheDocument();
    expect(bar1).toHaveClass("bar");
  });

  test("renders bar2 element", () => {
    const { container } = render(<LinearProgress />);

    const bar2 = container.querySelector(".bar2");
    expect(bar2).toBeInTheDocument();
    expect(bar2).toHaveClass("bar");
  });

  test("has correct structure with parent and child elements", () => {
    const { container } = render(<LinearProgress />);

    const progressContainer = container.querySelector(".linear-progress");
    const bars = progressContainer?.querySelectorAll(".bar");

    expect(progressContainer).toBeInTheDocument();
    expect(bars).toHaveLength(2);
  });

  test("renders without errors", () => {
    expect(() => render(<LinearProgress />)).not.toThrow();
  });

  test("applies correct CSS classes", () => {
    const { container } = render(<LinearProgress />);

    const progressContainer = container.querySelector(".linear-progress");
    const bar1 = container.querySelector(".bar.bar1");
    const bar2 = container.querySelector(".bar.bar2");

    expect(progressContainer).toHaveClass("linear-progress");
    expect(bar1).toHaveClass("bar", "bar1");
    expect(bar2).toHaveClass("bar", "bar2");
  });

  test("renders consistently on multiple renders", () => {
    const { container, rerender } = render(<LinearProgress />);

    const initialHTML = container.innerHTML;

    rerender(<LinearProgress />);

    expect(container.innerHTML).toBe(initialHTML);
  });

  test("is a self-contained component without props", () => {
    const { container } = render(<LinearProgress />);

    const progressElement = container.querySelector(".linear-progress");
    expect(progressElement).toBeInTheDocument();
  });

  test("maintains correct DOM hierarchy", () => {
    const { container } = render(<LinearProgress />);

    const progressContainer = container.querySelector(".linear-progress");
    const bars = progressContainer?.children;

    expect(bars).toHaveLength(2);
    expect(bars?.[0]).toHaveClass("bar", "bar1");
    expect(bars?.[1]).toHaveClass("bar", "bar2");
  });
});
