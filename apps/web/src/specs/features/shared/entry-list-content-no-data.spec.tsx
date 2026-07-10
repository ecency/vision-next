import { vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// isCommunity is not part of the global @/utils mock; provide a lightweight one.
vi.mock("@/utils", () => ({
  isCommunity: (s: string) => /^hive-\d+/.test(s ?? "")
}));

import { EntryListContentNoData } from "@/features/shared/entry-list-content/entry-list-content-no-data";

describe("EntryListContentNoData", () => {
  test("nudges empty personal feed toward Waves and the getting-started guide", () => {
    render(<EntryListContentNoData username="" section="feed" loading={false} />);

    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/discover");
    expect(hrefs).toContain("/waves");
    expect(hrefs).toContain("/@ecency/your-first-week-on-ecency");
  });

  test("does not add the Waves nudge to a non-personal empty list", () => {
    render(<EntryListContentNoData username="@someoneelse" section="blog" loading={false} />);

    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain("/waves");
    expect(hrefs).not.toContain("/@ecency/your-first-week-on-ecency");
  });

  test("renders nothing while loading", () => {
    const { container } = render(
      <EntryListContentNoData username="" section="feed" loading={true} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
