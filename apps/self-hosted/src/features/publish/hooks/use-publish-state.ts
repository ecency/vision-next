import { useCallback } from "react";
import { useLocalStorage } from "react-use";

const STORAGE_KEY = "publish-draft";

interface PublishDraft {
  title: string;
  content: string;
  tags: string[];
}

const MAX_TITLE_LENGTH = 255;
const MAX_TAG_LENGTH = 24;

const defaultDraft: PublishDraft = {
  title: "",
  content: "",
  tags: [],
};

export function usePublishState() {
  const [draft, setDraft, removeDraft] = useLocalStorage<PublishDraft>(
    STORAGE_KEY,
    defaultDraft,
  );

  // Wrapper for setTitleState with validation
  const setTitleState = useCallback(
    (value: string) => {
      setDraft((prev) => ({
        ...(prev ?? defaultDraft),
        title: value.slice(0, MAX_TITLE_LENGTH),
      }));
    },
    [setDraft],
  );

  // Wrapper for setContentState
  const setContentState = useCallback(
    (value: string) => {
      setDraft((prev) => ({
        ...(prev ?? defaultDraft),
        content: value,
      }));
    },
    [setDraft],
  );

  // Wrapper for setTagsState with validation
  const setTagsState = useCallback(
    (value: string[]) => {
      const sanitized = value
        .map((tag) => tag.slice(0, MAX_TAG_LENGTH).trim())
        .filter((tag) => tag.length > 0);
      const unique = Array.from(new Set(sanitized));
      setDraft((prev) => ({
        ...(prev ?? defaultDraft),
        tags: unique,
      }));
    },
    [setDraft],
  );

  const clearAll = useCallback(() => {
    removeDraft();
  }, [removeDraft]);

  return {
    title: draft?.title ?? "",
    content: draft?.content ?? "",
    tags: draft?.tags ?? [],
    setTitleState,
    setContentState,
    setTagsState,
    clearAll,
  };
}
