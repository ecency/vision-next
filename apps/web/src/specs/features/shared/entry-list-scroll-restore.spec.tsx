import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EntryListScrollRestore } from "@/features/shared/entry-list-content/entry-list-scroll-restore";

const STORAGE_KEY = "ecency:entry-list-anchor";

function card(id: string) {
  return (
    <div className="entry-list-item" id={id}>
      {/* hash href: jsdom implements hash navigation, and a real path logs a
          "Not implemented: navigation" for every click. */}
      <a href={`#${id}`}>{id}</a>
    </div>
  );
}

/** A list on a given URL, with the restore mounted the way EntryListContent mounts it. */
function renderList(url: string, ids: string[]) {
  window.history.replaceState({}, "", url);
  return render(
    <>
      <EntryListScrollRestore />
      {ids.map((id) => (
        <React.Fragment key={id}>{card(id)}</React.Fragment>
      ))}
    </>
  );
}

describe("EntryListScrollRestore", () => {
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    // jsdom does not implement it.
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView as never;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("remembers the card the reader clicked through", () => {
    const { getByText } = renderList("/trending", ["alice-one", "bob-two"]);

    fireEvent.click(getByText("bob-two"));

    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
    expect(stored.id).toBe("bob-two");
    expect(stored.url).toBe("/trending");
  });

  it("scrolls that card into view when the same list comes back", () => {
    const { getByText, unmount } = renderList("/trending", ["alice-one", "bob-two"]);
    fireEvent.click(getByText("bob-two"));
    unmount();

    const { container } = renderList("/trending", ["alice-one", "bob-two"]);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    // Called on the right element, not merely called.
    expect(scrollIntoView.mock.instances[0]).toBe(container.querySelector("#bob-two"));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" });
  });

  it("restores once, not on every later visit", () => {
    const { getByText, unmount } = renderList("/trending", ["alice-one", "bob-two"]);
    fireEvent.click(getByText("bob-two"));
    unmount();

    renderList("/trending", ["alice-one", "bob-two"]).unmount();
    renderList("/trending", ["alice-one", "bob-two"]);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("does not restore onto a different feed", () => {
    const { getByText, unmount } = renderList("/trending", ["alice-one", "bob-two"]);
    fireEvent.click(getByText("bob-two"));
    unmount();

    renderList("/hot", ["alice-one", "bob-two"]);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("does not restore a position the reader left half an hour ago", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ url: "/trending", id: "bob-two", at: Date.now() - 31 * 60 * 1000 })
    );

    renderList("/trending", ["alice-one", "bob-two"]);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("keeps watching for a card that paints later, not one timed guess", async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ url: "/trending", id: "late-card", at: Date.now() })
    );

    const { container } = renderList("/trending", ["alice-one"]);
    expect(scrollIntoView).not.toHaveBeenCalled();

    // Well past any fixed retry a first version of this might have used.
    await new Promise((resolve) => setTimeout(resolve, 700));
    const late = document.createElement("div");
    late.id = "late-card";
    container.appendChild(late);

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
  });

  it("gives up rather than yanking the reader after the window closes", () => {
    vi.useFakeTimers();
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ url: "/trending", id: "very-late", at: Date.now() })
    );

    const { container } = renderList("/trending", ["alice-one"]);
    vi.advanceTimersByTime(3001);

    const late = document.createElement("div");
    late.id = "very-late";
    container.appendChild(late);
    vi.advanceTimersByTime(1000);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("survives storage being unavailable", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    const { getByText } = renderList("/trending", ["alice-one"]);
    expect(() => fireEvent.click(getByText("alice-one"))).not.toThrow();

    setItem.mockRestore();
  });
});
