import { vi } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProfileLink, makePathProfile } from "@/features/shared/profile-link";

describe("ProfileLink", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("makePathProfile", () => {
    it("builds the canonical /@username profile route", () => {
      expect(makePathProfile("alice")).toBe("/@alice");
      expect(makePathProfile("bob123")).toBe("/@bob123");
    });
  });

  it("renders an anchor pointing at the user's profile route", () => {
    render(
      <ProfileLink username="alice">
        <span>Alice</span>
      </ProfileLink>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/@alice");
  });

  it("renders the provided children inside the link", () => {
    render(
      <ProfileLink username="bob">
        <span data-testid="child">{"Bob's avatar"}</span>
      </ProfileLink>
    );

    const link = screen.getByRole("link");
    const child = screen.getByTestId("child");
    expect(child).toHaveTextContent("Bob's avatar");
    expect(link).toContainElement(child);
  });

  it("exposes an accessible label of @username", () => {
    render(
      <ProfileLink username="carol">
        <span>profile</span>
      </ProfileLink>
    );

    // aria-label = `@${username}` -> queryable via accessible name.
    expect(screen.getByRole("link", { name: "@carol" })).toHaveAttribute("href", "/@carol");
  });

  it("forwards target and className to the rendered anchor", () => {
    render(
      <ProfileLink username="dave" target="_blank" className="profile-link-class">
        <span>open</span>
      </ProfileLink>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveClass("profile-link-class");
  });

  it("invokes afterClick when the link is clicked", () => {
    const afterClick = vi.fn();
    render(
      <ProfileLink username="erin" afterClick={afterClick}>
        <span>go</span>
      </ProfileLink>
    );

    fireEvent.click(screen.getByRole("link"));
    expect(afterClick).toHaveBeenCalledTimes(1);
  });

  it("does not throw when clicked without an afterClick handler", () => {
    render(
      <ProfileLink username="frank">
        <span>go</span>
      </ProfileLink>
    );

    expect(() => fireEvent.click(screen.getByRole("link"))).not.toThrow();
  });
});
