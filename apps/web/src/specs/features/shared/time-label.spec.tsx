import { vi, describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@/utils", async () => {
  const actual = await vi.importActual("@/utils");
  return { ...actual as any };
});

import { TimeLabel } from "@/features/shared/time-label";

describe("TimeLabel", () => {
  const created = "2024-06-15T12:00:00Z";

  it("renders a span with date class", () => {
    const { container } = render(<TimeLabel created={created} />);
    const span = container.querySelector("span.date");
    expect(span).toBeInTheDocument();
    // After useEffect, shows relative time or formatted date
    expect(span?.textContent).toBeTruthy();
  });

  it("has a title attribute with date info", () => {
    const { container } = render(<TimeLabel created={created} />);
    const span = container.querySelector("span.date");
    expect(span).toHaveAttribute("title");
  });

  it("renders empty for empty created", () => {
    const { container } = render(<TimeLabel created="" />);
    const span = container.querySelector("span.date");
    expect(span?.textContent).toBe("");
  });
});
