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

  it("redirects /onboard-friend/asking/* to /signup/invited (visitor flow, no hash)", () => {
    render(<OnboardFriend params={{ slugs: ["asking", "somehash"] }} />);
    expect(mockReplace).toHaveBeenCalledWith("/signup/invited");
  });

  it("redirects /onboard-friend/creating/{hash} to /signup/invited/{hash} (sponsor flow)", () => {
    render(<OnboardFriend params={{ slugs: ["creating", "abc123hash"] }} />);
    expect(mockReplace).toHaveBeenCalledWith(`/signup/invited/${encodeURIComponent("abc123hash")}`);
  });

  it("redirects /onboard-friend/creating (no hash) to /signup/invited", () => {
    render(<OnboardFriend params={{ slugs: ["creating"] }} />);
    expect(mockReplace).toHaveBeenCalledWith("/signup/invited");
  });

  it("redirects /onboard-friend/{hash} (single slug) to /signup/invited/{hash}", () => {
    render(<OnboardFriend params={{ slugs: ["directhash"] }} />);
    expect(mockReplace).toHaveBeenCalledWith(`/signup/invited/${encodeURIComponent("directhash")}`);
  });

  it("redirects to /signup/invited when no slugs", () => {
    render(<OnboardFriend params={{ slugs: [] }} />);
    expect(mockReplace).toHaveBeenCalledWith("/signup/invited");
  });
});
