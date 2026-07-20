import { vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

// setup-any-spec globally stubs ProBadge to a no-op so provider-free container
// specs don't crash on its useQuery. This spec is specifically about the badge
// wiring, so restore the real component here and instead stub useQuery, letting
// us render it against a known roster without a QueryClient or a network call.
vi.mock("@/features/pro/pro-badge", async (importOriginal) => await importOriginal());

const useQueryMock = vi.fn();
vi.mock("@tanstack/react-query", async () => ({
  ...(await vi.importActual("@tanstack/react-query")),
  useQuery: (...args: unknown[]) => useQueryMock(...args)
}));

import { ProfilePopoverAuthor } from "@/features/shared/profile-popover/profile-popover-author";

// i18next is globally mocked to echo keys, so the badge's aria-label is the key.
const BADGE = '[aria-label="pro.badge-title"]';

// This label is what every feed card, comment and discover row renders for the
// author, so a Pro member losing the checkmark here means losing it across the
// whole site — which is exactly the regression this guards.
describe("ProfilePopoverAuthor", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it("shows the Pro checkmark next to a member's handle", () => {
    useQueryMock.mockReturnValue({ data: { members: ["seckorama"], count: 1 } });

    const { container } = render(<ProfilePopoverAuthor author="seckorama" />);

    expect(container.textContent).toContain("seckorama");
    expect(container.querySelector(BADGE)).not.toBeNull();
  });

  it("matches the roster case-insensitively", () => {
    useQueryMock.mockReturnValue({ data: { members: ["SeckoRama"], count: 1 } });

    const { container } = render(<ProfilePopoverAuthor author="seckorama" />);

    expect(container.querySelector(BADGE)).not.toBeNull();
  });

  it("renders no checkmark for a non-member", () => {
    useQueryMock.mockReturnValue({ data: { members: ["seckorama"], count: 1 } });

    const { container } = render(<ProfilePopoverAuthor author="good-karma" />);

    expect(container.textContent).toContain("good-karma");
    expect(container.querySelector(BADGE)).toBeNull();
  });

  it("renders the handle unchanged while the roster is still loading", () => {
    useQueryMock.mockReturnValue({ data: undefined });

    const { container } = render(<ProfilePopoverAuthor author="seckorama" />);

    expect(container.textContent).toContain("seckorama");
    expect(container.querySelector(BADGE)).toBeNull();
  });
});
