import React from "react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { UIManager } from "@ui/core";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { PopoverConfirm } from "@/features/ui/popover-confirm";

// Regression for the "silent comment delete" bug. PopoverConfirm renders its
// confirm buttons through a portal OUTSIDE the dropdown's DOM, while Dropdown
// closes itself on document mousedown via useClickAway (guarded by
// UIContext.openPopovers). Before Popover registered itself in openPopovers,
// pressing the confirm button tore down the dropdown — and the popover with
// it — on mousedown, before the click could reach onConfirm: the action never
// ran and no feedback was shown. This mirrors the comment-delete menu in
// discussion-item.tsx (real Dropdown, real Popover, real portal).
function renderMenuWithConfirm(onConfirm: () => void) {
  return render(
    <UIManager>
      <Dropdown>
        <DropdownToggle>
          <button type="button">menu</button>
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItemWithIcon
            label={
              <PopoverConfirm onConfirm={onConfirm}>
                <div>Delete</div>
              </PopoverConfirm>
            }
          />
        </DropdownMenu>
      </Dropdown>
    </UIManager>
  );
}

describe("Dropdown + PopoverConfirm", () => {
  it("keeps the menu mounted on mousedown over the portaled confirm button and fires onConfirm on click", async () => {
    const onConfirm = vi.fn();
    renderMenuWithConfirm(onConfirm);

    fireEvent.click(screen.getByText("menu"));
    fireEvent.click(screen.getByText("Delete"));
    const ok = await screen.findByText("confirm.ok");

    // mousedown lands outside the dropdown's DOM (portal) and triggers its
    // click-away handler; the open popover must keep the menu alive.
    fireEvent.mouseDown(ok);
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("confirm.ok")).toBeInTheDocument();

    fireEvent.click(ok);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("restores normal outside-mousedown dismissal once the confirm popover is cancelled", async () => {
    const onConfirm = vi.fn();
    renderMenuWithConfirm(onConfirm);

    fireEvent.click(screen.getByText("menu"));
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(await screen.findByText("confirm.cancel"));

    // The popover unregistered itself, so the guard no longer applies.
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("closes on outside mousedown while no popover is open", () => {
    renderMenuWithConfirm(vi.fn());

    fireEvent.click(screen.getByText("menu"));
    expect(screen.getByText("Delete")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });
});
