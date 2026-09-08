import { render, act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useGlobalStore } from "@/core/global-store";
import { ListStyle } from "@/enums";
import { ReadingListLoading } from "@/features/shared/reading-layout/reading-list-loading";

// Loading routes must follow the same shared preference as loaded lists.
describe("ReadingListLoading", () => {
  afterEach(() => useGlobalStore.getState().setListStyle(ListStyle.row));

  it("uses the selected grid preference and follows changes back to rows", () => {
    useGlobalStore.getState().setListStyle(ListStyle.grid);
    const { container } = render(<ReadingListLoading showProgress />);
    expect(container.querySelector(".entry-list-body.grid-view")).not.toBeNull();
    expect(container.querySelectorAll(".entry-list-loading-item")).toHaveLength(6);
    expect(container.querySelector(".linear-progress")).not.toBeNull();
    act(() => useGlobalStore.getState().setListStyle(ListStyle.row));
    expect(container.querySelector(".entry-list-body.grid-view")).toBeNull();
    expect(container.querySelectorAll(".entry-list-loading-item")).toHaveLength(6);
  });
});
