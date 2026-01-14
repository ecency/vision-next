import { vi } from 'vitest';
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DetectBottom } from "@/features/shared/detect-bottom";

// Mock the react-in-viewport hook
vi.mock("react-in-viewport", () => ({
  useInViewport: vi.fn()
}));

import { useInViewport } from "react-in-viewport";

describe("DetectBottom", () => {
  const mockOnBottom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders without crashing", () => {
    (useInViewport as any).mockReturnValue({ inViewport: false });

    const { container } = render(<DetectBottom onBottom={mockOnBottom} />);

    expect(container.querySelector("div")).toBeInTheDocument();
  });

  test("calls onBottom when element enters viewport", () => {
    (useInViewport as any).mockReturnValue({ inViewport: true });

    render(<DetectBottom onBottom={mockOnBottom} />);

    expect(mockOnBottom).toHaveBeenCalled();
  });

  test("does not call onBottom when element is not in viewport", () => {
    (useInViewport as any).mockReturnValue({ inViewport: false });

    render(<DetectBottom onBottom={mockOnBottom} />);

    expect(mockOnBottom).not.toHaveBeenCalled();
  });

  test("calls onBottom only once when in viewport", () => {
    (useInViewport as any).mockReturnValue({ inViewport: true });

    render(<DetectBottom onBottom={mockOnBottom} />);

    expect(mockOnBottom).toHaveBeenCalledTimes(1);
  });

  test("updates when inViewport changes from false to true", () => {
    // Set initial mock value before first render
    (useInViewport as any).mockReturnValue({ inViewport: false });

    const { rerender } = render(<DetectBottom onBottom={mockOnBottom} />);

    expect(mockOnBottom).not.toHaveBeenCalled();

    (useInViewport as any).mockReturnValue({ inViewport: true });
    rerender(<DetectBottom onBottom={mockOnBottom} />);

    expect(mockOnBottom).toHaveBeenCalled();
  });

  test("uses correct rootMargin configuration", () => {
    (useInViewport as any).mockReturnValue({ inViewport: false });

    render(<DetectBottom onBottom={mockOnBottom} />);

    expect(useInViewport).toHaveBeenCalledWith(
      expect.any(Object),
      { rootMargin: "0px 0px 200px 0px" }
    );
  });

  test("creates ref and passes it to useInViewport", () => {
    (useInViewport as any).mockReturnValue({ inViewport: false });

    render(<DetectBottom onBottom={mockOnBottom} />);

    const callArgs = (useInViewport as any).mock.calls[0];
    expect(callArgs[0]).toHaveProperty("current");
  });

  test("handles rapid viewport changes", () => {
    const { rerender } = render(<DetectBottom onBottom={mockOnBottom} />);

    (useInViewport as any).mockReturnValue({ inViewport: true });
    rerender(<DetectBottom onBottom={mockOnBottom} />);

    (useInViewport as any).mockReturnValue({ inViewport: false });
    rerender(<DetectBottom onBottom={mockOnBottom} />);

    (useInViewport as any).mockReturnValue({ inViewport: true });
    rerender(<DetectBottom onBottom={mockOnBottom} />);

    expect(mockOnBottom).toHaveBeenCalled();
  });

  test("handles different onBottom callbacks", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    (useInViewport as any).mockReturnValue({ inViewport: true });

    const { rerender } = render(<DetectBottom onBottom={callback1} />);

    expect(callback1).toHaveBeenCalled();

    rerender(<DetectBottom onBottom={callback2} />);

    expect(callback2).toHaveBeenCalled();
  });

  test("renders a single div element", () => {
    (useInViewport as any).mockReturnValue({ inViewport: false });

    const { container } = render(<DetectBottom onBottom={mockOnBottom} />);

    const divs = container.querySelectorAll("div");
    expect(divs).toHaveLength(1);
  });

  test("div element has ref attached", () => {
    (useInViewport as any).mockReturnValue({ inViewport: false });

    render(<DetectBottom onBottom={mockOnBottom} />);

    expect(useInViewport).toHaveBeenCalled();
    const refArg = (useInViewport as any).mock.calls[0][0];
    expect(refArg).toHaveProperty("current");
  });

  test("handles onBottom callback that returns a value", () => {
    const onBottomWithReturn = vi.fn(() => "returned value");
    (useInViewport as any).mockReturnValue({ inViewport: true });

    render(<DetectBottom onBottom={onBottomWithReturn} />);

    expect(onBottomWithReturn).toHaveBeenCalled();
  });
});
