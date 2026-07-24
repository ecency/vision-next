import { SUBMIT_TITLE_MAX_LENGTH } from "@/app/submit/_consts";
import { useLocalDraftManager } from "@/app/submit/_hooks/local-draft-manager";
import { PREFIX } from "@/utils/local-storage";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = PREFIX + "_local_draft";

// Regression: the waves composer and the deck threads form persist an
// overflowing post as { ...localDraft, body } into this shared key, with
// localDraft defaulting to {}. That stores a draft carrying neither title nor
// tags, and the submit page passed title straight into applyTitle ->
// value.slice(...), so every later visit to /submit crashed on mount
// (ECENCY-NEXT-1GJC). The manager now substitutes empty values for whichever
// fields the stored draft is missing.
function renderManager(
  onDraftLoaded: (title: string, tags: string[], body: string) => void = vi.fn(),
  setIsDraftEmpty = vi.fn()
) {
  const view = renderHook(() =>
    useLocalDraftManager("/submit", undefined, undefined, undefined, setIsDraftEmpty, onDraftLoaded)
  );
  return { ...view, onDraftLoaded, setIsDraftEmpty };
}

describe("useLocalDraftManager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("substitutes empty values for a draft stored without title and tags", () => {
    localStorage.setItem(KEY, JSON.stringify({ body: "an overflowing wave" }));

    const { onDraftLoaded, setIsDraftEmpty } = renderManager();

    expect(onDraftLoaded).toHaveBeenCalledWith("", [], "an overflowing wave");
    // The body still counts as content, so the editor must not treat the
    // recovered draft as empty and discard it.
    expect(setIsDraftEmpty).toHaveBeenCalledWith(false);
  });

  it("survives a consumer that treats title as a string and tags as an array", () => {
    localStorage.setItem(KEY, JSON.stringify({ body: "an overflowing wave" }));

    // Mirrors applyTitle/applyTags on the submit page, which is where the
    // TypeError was raised.
    const applied = { title: "unset", tags: ["unset"] };
    expect(() =>
      renderManager((title, tags) => {
        applied.title = title.slice(0, SUBMIT_TITLE_MAX_LENGTH);
        applied.tags = tags.filter((tag) => !!tag);
      })
    ).not.toThrow();

    expect(applied).toEqual({ title: "", tags: [] });
  });

  it("passes a complete draft through untouched", () => {
    const draft = { title: "a title", tags: ["hive", "ecency"], body: "a body" };
    localStorage.setItem(KEY, JSON.stringify(draft));

    const { onDraftLoaded, setIsDraftEmpty } = renderManager();

    expect(onDraftLoaded).toHaveBeenCalledWith(draft.title, draft.tags, draft.body);
    expect(setIsDraftEmpty).toHaveBeenCalledWith(false);
  });

  it("loads nothing and reports empty for a missing or empty draft", () => {
    const missing = renderManager();
    expect(missing.onDraftLoaded).not.toHaveBeenCalled();
    expect(missing.setIsDraftEmpty).toHaveBeenCalledWith(true);

    localStorage.setItem(KEY, JSON.stringify({}));

    const empty = renderManager();
    expect(empty.onDraftLoaded).not.toHaveBeenCalled();
    expect(empty.setIsDraftEmpty).toHaveBeenCalledWith(true);
  });
});
