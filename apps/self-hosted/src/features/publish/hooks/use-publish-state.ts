import { useCallback } from "react";
import { useSynchronizedLocalStorage } from "@/utils/use-synchronized-local-storage";

const STORAGE_KEY_PREFIX = "publish-draft";
const KEY_TITLE = `${STORAGE_KEY_PREFIX}-title`;
const KEY_BODY = `${STORAGE_KEY_PREFIX}-body`;
const KEY_TAGS = `${STORAGE_KEY_PREFIX}-tags`;

const MAX_TITLE_LENGTH = 255;
const MAX_TAG_LENGTH = 24;

const defaultTitle = "";
const defaultBody = "";
const defaultTags: string[] = [];

export function usePublishState() {
  const [title, setTitle] = useSynchronizedLocalStorage<string>(
    KEY_TITLE,
    defaultTitle,
  );
  const [content, setContent] = useSynchronizedLocalStorage<string>(
    KEY_BODY,
    defaultBody,
  );
  const [tags, setTags] = useSynchronizedLocalStorage<string[]>(
    KEY_TAGS,
    defaultTags,
  );

  const setTitleState = useCallback(
    (value: string) => {
      setTitle(value.slice(0, MAX_TITLE_LENGTH));
    },
    [setTitle]
  );

  const setContentState = useCallback(
    (value: string) => {
      setContent(value);
    },
    [setContent]
  );

  const setTagsState = useCallback(
    (value: string[]) => {
      const sanitized = value
        .map((tag) => tag.slice(0, MAX_TAG_LENGTH).trim())
        .filter((tag) => tag.length > 0);
      setTags(Array.from(new Set(sanitized)));
    },
    [setTags]
  );

  const clearAll = useCallback(() => {
    setTitle(defaultTitle);
    setContent(defaultBody);
    setTags(defaultTags);
  }, [setTitle, setContent, setTags]);

  return {
    title,
    content,
    tags,
    setTitleState,
    setContentState,
    setTagsState,
    clearAll,
  };
}
