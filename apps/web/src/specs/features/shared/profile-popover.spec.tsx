import React from "react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfilePopover } from "@/features/shared/profile-popover";

// Replace the heavy hover card (floating-ui + ProfilePreview fetch) with a
// sentinel so we can assert exactly WHEN it mounts.
vi.mock("@/features/shared/profile-popover/profile-popover-card", () => ({
  default: ({ author }: { author: string }) => (
    <div data-testid="popover-card">card:{author}</div>
  )
}));

describe("ProfilePopover lazy mount", () => {
  it("renders the author label in the initial/SSR output without the heavy card", () => {
    render(<ProfilePopover entry={{ author: "alice" } as any} />);
    expect(screen.getByText("alice")).toBeInTheDocument();
    // The floating-ui/portal/preview machinery must NOT mount until interaction.
    expect(screen.queryByTestId("popover-card")).toBeNull();
  });

  it("mounts the hover card on first mouse enter", () => {
    render(<ProfilePopover entry={{ author: "alice" } as any} />);
    fireEvent.mouseEnter(screen.getByText("alice").parentElement!);
    expect(screen.getByTestId("popover-card")).toBeInTheDocument();
  });

  it("mounts the hover card on a deliberate tap/click (mobile)", () => {
    render(<ProfilePopover entry={{ author: "alice" } as any} />);
    fireEvent.click(screen.getByText("alice").parentElement!);
    expect(screen.getByTestId("popover-card")).toBeInTheDocument();
  });

  it("uses the original_entry author for cross-posts", () => {
    render(
      <ProfilePopover
        entry={{ author: "bob", original_entry: { author: "carol" } } as any}
      />
    );
    expect(screen.getByText("carol")).toBeInTheDocument();
  });
});
