import { vi } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock @ui/popover so we don't pull in floating-ui / portals.
// The mock renders the trigger (directContent) and the content inline,
// and exposes show/setShow through a data attribute for assertions.
vi.mock("@ui/popover", () => {
  return {
    Popover: ({
      directContent,
      show,
      children
    }: {
      directContent: React.ReactNode;
      show: boolean;
      setShow: (value: boolean) => void;
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <div data-testid="popover-root" data-show={String(show)}>
        {directContent}
        {show && <div data-testid="popover-content">{children}</div>}
      </div>
    ),
    PopoverTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  };
});

// The component under test imports i18next for button labels.
vi.mock("i18next", () => ({
  default: {
    t: (key: string) => key
  }
}));

import { PopoverConfirm } from "@/features/ui/popover-confirm";

describe("PopoverConfirm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("child onClick composition", () => {
    it("calls the child's original onClick before toggling the popover", () => {
      const callOrder: string[] = [];
      const childOnClick = vi.fn(() => {
        // When the child handler runs, the popover must still be closed.
        const root = screen.getByTestId("popover-root");
        callOrder.push(`child:show=${root.getAttribute("data-show")}`);
      });

      render(
        <PopoverConfirm onConfirm={vi.fn()}>
          <button type="button" onClick={childOnClick}>
            Trigger
          </button>
        </PopoverConfirm>
      );

      // Initial state: popover hidden
      expect(screen.getByTestId("popover-root")).toHaveAttribute("data-show", "false");

      fireEvent.click(screen.getByText("Trigger"));

      // Child handler was called exactly once
      expect(childOnClick).toHaveBeenCalledTimes(1);
      // At the time the child handler ran, show was still false
      expect(callOrder).toEqual(["child:show=false"]);
      // After the event, show has toggled to true
      expect(screen.getByTestId("popover-root")).toHaveAttribute("data-show", "true");
    });

    it("toggles popover visibility on each click when the child has no onClick", () => {
      render(
        <PopoverConfirm onConfirm={vi.fn()}>
          <button type="button">Trigger</button>
        </PopoverConfirm>
      );

      const trigger = screen.getByText("Trigger");
      const root = screen.getByTestId("popover-root");

      expect(root).toHaveAttribute("data-show", "false");

      fireEvent.click(trigger);
      expect(root).toHaveAttribute("data-show", "true");

      fireEvent.click(trigger);
      expect(root).toHaveAttribute("data-show", "false");
    });

    it("toggles popover visibility correctly across multiple clicks (regression for stale closure)", () => {
      const childOnClick = vi.fn();

      render(
        <PopoverConfirm onConfirm={vi.fn()}>
          <button type="button" onClick={childOnClick}>
            Trigger
          </button>
        </PopoverConfirm>
      );

      const trigger = screen.getByText("Trigger");
      const root = screen.getByTestId("popover-root");

      // Click 1: hidden -> visible
      fireEvent.click(trigger);
      expect(root).toHaveAttribute("data-show", "true");
      expect(childOnClick).toHaveBeenCalledTimes(1);

      // Click 2: visible -> hidden
      fireEvent.click(trigger);
      expect(root).toHaveAttribute("data-show", "false");
      expect(childOnClick).toHaveBeenCalledTimes(2);

      // Click 3: hidden -> visible
      fireEvent.click(trigger);
      expect(root).toHaveAttribute("data-show", "true");
      expect(childOnClick).toHaveBeenCalledTimes(3);
    });

    it("passes the click event through to the original child handler", () => {
      const childOnClick = vi.fn();

      render(
        <PopoverConfirm onConfirm={vi.fn()}>
          <button type="button" onClick={childOnClick}>
            Trigger
          </button>
        </PopoverConfirm>
      );

      fireEvent.click(screen.getByText("Trigger"));

      expect(childOnClick).toHaveBeenCalledTimes(1);
      const event = childOnClick.mock.calls[0][0];
      // Verify it received a real React synthetic event
      expect(event).toBeDefined();
      expect(event.type).toBe("click");
    });
  });
});
