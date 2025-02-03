import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";

export function usePublishState() {
  const [title, setTitle] = useSynchronizedLocalStorage(PREFIX + "_pub_title");
  const [content, setContent] = useSynchronizedLocalStorage(PREFIX + "pub_content");

  return {
    title,
    content,
    setTitle,
    setContent
  };
}
