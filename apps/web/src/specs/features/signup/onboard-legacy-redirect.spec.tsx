import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    replace: mockReplace,
    push: vi.fn(),
    pathname: "/"
  }))
}));

import { OnboardFriend } from "@/app/onboard-friend/[...slugs]/_page";

describe("OnboardFriend legacy redirect", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("redirects /onboard-friend/creating/{hash} to /signup/invited/{hash}", () => {
    render(<OnboardFriend params={{ slugs: ["creating", "abc123hash"] }} />);
    expect(mockReplace).toHaveBeenCalledWith("/signup/invited/abc123hash");
  });

  it("redirects /onboard-friend/asking/{hash} to /signup/invited/{hash}", () => {
    render(<OnboardFriend params={{ slugs: ["asking", "xyz789hash"] }} />);
    expect(mockReplace).toHaveBeenCalledWith("/signup/invited/xyz789hash");
  });

  it("redirects /onboard-friend/confirming/{hash} to /signup/invited/{hash}", () => {
    render(<OnboardFriend params={{ slugs: ["confirming", "confirmhash"] }} />);
    expect(mockReplace).toHaveBeenCalledWith("/signup/invited/confirmhash");
  });

  it("handles single slug (no prefix)", () => {
    render(<OnboardFriend params={{ slugs: ["directhash"] }} />);
    expect(mockReplace).toHaveBeenCalledWith("/signup/invited/directhash");
  });

  it("redirects to /signup/invited when no hash", () => {
    render(<OnboardFriend params={{ slugs: [] }} />);
    expect(mockReplace).toHaveBeenCalledWith("/signup/invited");
  });
});
