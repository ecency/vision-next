import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ListStyleToggle } from "@/features/shared/list-style-toggle";
import { useGlobalStore } from "@/core/global-store";
import { ListStyle } from "@/enums";

/**
 * ListStyleToggle reads `listStyle` from the real Zustand global store and
 * writes back through `setListStyle`. We drive the actual store here (it is not
 * globally mocked) so assertions reflect genuine state transitions rather than
 * a stubbed handler.
 */
describe("ListStyleToggle", () => {
  // Reset the store to the known initial value before each test so cases don't
  // leak layout state into one another.
  beforeEach(() => {
    useGlobalStore.getState().setListStyle(ListStyle.row);
  });

  afterEach(() => {
    vi.clearAllMocks();
    useGlobalStore.getState().setListStyle(ListStyle.row);
  });

  // The two layout items render their i18n label keys verbatim (i18next is
  // globally mocked to echo the key). The dropdown only mounts its items once
  // the toggle is clicked, so this also exercises the open interaction.
  function openDropdown() {
    // The toggle is the inner Button rendered inside DropdownToggle.
    fireEvent.click(screen.getByRole("button"));
  }

  it("opens the layout menu on toggle click, exposing grid and classic options", () => {
    render(<ListStyleToggle />);

    // Items are not in the DOM until the dropdown is opened.
    expect(screen.queryByText("layouts.grid")).not.toBeInTheDocument();
    expect(screen.queryByText("layouts.classic")).not.toBeInTheDocument();

    openDropdown();

    expect(screen.getByText("layouts.grid")).toBeInTheDocument();
    expect(screen.getByText("layouts.classic")).toBeInTheDocument();
  });

  // The clickable DropdownItem (the one carrying selected-state styling) is the
  // `role="menuitem"` ancestor of the label text.
  function menuItemFor(label: string) {
    return screen.getByText(label).closest("[role='menuitem']");
  }

  // DropdownItem adds the bare `bg-blue-dark-sky-040` token only to the selected
  // item; the unselected item instead carries the prefixed `hover:bg-blue-dark-sky-040`
  // token. classList.contains matches the exact token, so it cleanly distinguishes them.
  const isSelected = (el: Element | null) => !!el?.classList.contains("bg-blue-dark-sky-040");

  it("marks the option matching the current store value as selected", () => {
    // Store starts as `row`, so the classic (row) item should be the selected one.
    render(<ListStyleToggle />);
    openDropdown();

    expect(isSelected(menuItemFor("layouts.classic"))).toBe(true);
    expect(isSelected(menuItemFor("layouts.grid"))).toBe(false);
  });

  it("reflects a grid store value by selecting the grid option instead", () => {
    useGlobalStore.getState().setListStyle(ListStyle.grid);

    render(<ListStyleToggle />);
    openDropdown();

    expect(isSelected(menuItemFor("layouts.grid"))).toBe(true);
    expect(isSelected(menuItemFor("layouts.classic"))).toBe(false);
  });

  it("switches the store to grid when the grid option is clicked", () => {
    render(<ListStyleToggle />);
    openDropdown();

    expect(useGlobalStore.getState().listStyle).toBe(ListStyle.row);

    fireEvent.click(screen.getByText("layouts.grid"));

    expect(useGlobalStore.getState().listStyle).toBe(ListStyle.grid);
  });

  it("switches the store back to row when the classic option is clicked", () => {
    useGlobalStore.getState().setListStyle(ListStyle.grid);

    render(<ListStyleToggle />);
    openDropdown();

    expect(useGlobalStore.getState().listStyle).toBe(ListStyle.grid);

    fireEvent.click(screen.getByText("layouts.classic"));

    expect(useGlobalStore.getState().listStyle).toBe(ListStyle.row);
  });

  it("forwards the custom iconClass onto the toggle icon spans", () => {
    const { container } = render(<ListStyleToggle iconClass="my-custom-icon" />);

    // Both the view-layout glyph and the menu-down chevron receive iconClass.
    const tagged = container.querySelectorAll(".my-custom-icon");
    expect(tagged.length).toBe(2);
  });
});
