import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "publish-draft";

interface PublishDraft {
  title: string;
  content: string;
  tags: string[];
}

const MAX_TITLE_LENGTH = 255;
const MAX_TAG_LENGTH = 24;

export function usePublishState() {
  const [title, setTitleState] = useState<string>("");
  const [content, setContentState] = useState<string>("");
  const [tags, setTagsState] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const draft: PublishDraft = JSON.parse(stored);
        setTitleState(draft.title || "");
        setContentState(draft.content || "");
        setTagsState(draft.tags || []);
      }
    } catch (error) {
      console.error("Failed to load draft from localStorage:", error);
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const draft: PublishDraft = {
          title,
          content,
          tags
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch (error) {
        console.error("Failed to save draft to localStorage:", error);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [title, content, tags]);

  const setTitle = useCallback((value: string) => {
    setTitleState(value.slice(0, MAX_TITLE_LENGTH));
  }, []);

  const setContent = useCallback((value: string) => {
    setContentState(value);
  }, []);

  const setTags = useCallback((value: string[]) => {
    const sanitized = value
      .map((tag) => tag.slice(0, MAX_TAG_LENGTH).trim())
      .filter((tag) => tag.length > 0);
    const unique = Array.from(new Set(sanitized));
    setTagsState(unique);
  }, []);

  const clearAll = useCallback(() => {
    setTitleState("");
    setContentState("");
    setTagsState([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear draft from localStorage:", error);
    }
  }, []);

  return {
    title,
    content,
    tags,
    setTitle,
    setContent,
    setTags,
    clearAll
  };
}
