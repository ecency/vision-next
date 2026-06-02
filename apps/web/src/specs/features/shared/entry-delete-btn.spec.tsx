import { vi } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// next/navigation: EntryDeleteBtn calls useRouter() and pushes "/" on success.
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

// useDeleteComment is the data hook that owns the actual broadcast. We mock it
// so the test is deterministic: we control isPending and inspect mutateAsync.
const mutateAsync = vi.fn();
const useDeleteComment = vi.fn(() => ({ mutateAsync, isPending: false }));
vi.mock("@/api/mutations", () => ({
  useDeleteComment: (...args: unknown[]) => useDeleteComment(...args)
}));

// Mock the floating-ui / portal layer so the real PopoverConfirm renders inline
// (same approach as the existing popover-confirm spec). This lets us exercise
// the REAL PopoverConfirm wiring that EntryDeleteBtn depends on.
vi.mock("@ui/popover", () => ({
  Popover: ({
    directContent,
    show,
    children
  }: {
    directContent: React.ReactNode;
    show: boolean;
    setShow: (value: boolean) => void;
    children?: React.ReactNode;
  }) => (
    <div data-testid="popover-root" data-show={String(show)}>
      {directContent}
      {show && <div data-testid="popover-content">{children}</div>}
    </div>
  ),
  PopoverTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

import { EntryDeleteBtn } from "@/features/shared/entry-delete-btn";
import type { Entry } from "@/entities";

const entry = {
  author: "alice",
  permlink: "my-post",
  parent_author: "",
  parent_permlink: "blog"
} as unknown as Entry;

describe("EntryDeleteBtn", () => {
  beforeEach(() => {
    push.mockReset();
    mutateAsync.mockReset();
    useDeleteComment.mockReset();
    useDeleteComment.mockReturnValue({ mutateAsync, isPending: false });
  });

  it("renders the provided trigger child", () => {
    render(
      <EntryDeleteBtn entry={entry}>
        <button type="button">Delete</button>
      </EntryDeleteBtn>
    );
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("wires the delete mutation to the entry (and its parent) it is given", () => {
    const parent = { author: "bob", permlink: "root-post" } as unknown as Entry;

    render(
      <EntryDeleteBtn entry={entry} parent={parent}>
        <button type="button">Delete</button>
      </EntryDeleteBtn>
    );

    // First arg = the entry to delete, third arg = the parent (root) entry.
    expect(useDeleteComment).toHaveBeenCalled();
    const [calledEntry, , calledParent] = useDeleteComment.mock.calls[0] as unknown as [
      Entry,
      unknown,
      Entry
    ];
    expect(calledEntry).toBe(entry);
    expect(calledParent).toBe(parent);
  });

  it("opens a confirm popover on trigger click and fires the delete action on confirm", () => {
    render(
      <EntryDeleteBtn entry={entry}>
        <button type="button">Delete</button>
      </EntryDeleteBtn>
    );

    // Popover starts closed: no confirm controls visible.
    expect(screen.getByTestId("popover-root")).toHaveAttribute("data-show", "false");
    expect(screen.queryByText("confirm.ok")).not.toBeInTheDocument();

    // Click the trigger -> popover opens (PopoverConfirm toggles show).
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByTestId("popover-root")).toHaveAttribute("data-show", "true");

    // Confirm button (i18next mocked: key returned as-is) triggers the delete.
    expect(mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("confirm.ok"));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("does not fire the delete action when cancelled", () => {
    render(
      <EntryDeleteBtn entry={entry}>
        <button type="button">Delete</button>
      </EntryDeleteBtn>
    );

    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("confirm.cancel"));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("marks the child with the 'in-progress' class while the delete is pending", () => {
    useDeleteComment.mockReturnValue({ mutateAsync, isPending: true });

    render(
      <EntryDeleteBtn entry={entry}>
        <button type="button" className="delete-btn">
          Delete
        </button>
      </EntryDeleteBtn>
    );

    // Both the caller's class and the pending marker are present.
    expect(screen.getByText("Delete")).toHaveClass("delete-btn");
    expect(screen.getByText("Delete")).toHaveClass("in-progress");
  });

  it("preserves the caller's className and omits 'in-progress' while idle", () => {
    render(
      <EntryDeleteBtn entry={entry}>
        <button type="button" className="delete-btn">
          Delete
        </button>
      </EntryDeleteBtn>
    );

    const child = screen.getByText("Delete");
    // The caller's own class is preserved (EntryDeleteBtn reads
    // children.props.className), and the pending marker is absent while idle.
    expect(child).toHaveClass("delete-btn");
    expect(child).not.toHaveClass("in-progress");
  });
});
