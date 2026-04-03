import { vi, describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TimeLabel } from "@/features/shared/time-label";

describe("TimeLabel", () => {
  const created = "2024-06-15T12:00:00Z";

  it("renders UTC formatted date on initial render", () => {
    const { container } = render(<TimeLabel created={created} />);
    const span = container.querySelector("span.date");
    expect(span).toBeInTheDocument();
    // Initial render should show UTC format YYYY-MM-DD HH:mm
    expect(span?.textContent).toMatch(/2024-06-15 12:00/);
  });

  it("updates to relative time after mount", async () => {
    vi.useFakeTimers();
    const { container } = render(<TimeLabel created={created} />);

    await act(async () => {
      vi.runAllTimers();
    });

    const span = container.querySelector("span.date");
    // After useEffect, should show relative time (not the UTC format)
    expect(span?.textContent).not.toMatch(/2024-06-15/);
    vi.useRealTimers();
  });

  it("has formatted date as title tooltip", () => {
    const { container } = render(<TimeLabel created={created} />);
    const span = container.querySelector("span.date");
    expect(span).toHaveAttribute("title");
    // Title should contain the date in some format
    expect(span?.getAttribute("title")).toContain("2024");
  });

  it("returns empty string for empty created", () => {
    const { container } = render(<TimeLabel created="" />);
    const span = container.querySelector("span.date");
    expect(span?.textContent).toBe("");
  });
});
